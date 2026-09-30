#!/usr/bin/env bash
#
# Suggests tags for vault notes with an Ollama decision model (Jev-style, via
# /v1/systemone), and applies them one y/n at a time.
#
# The model sees only a note's title, description and body — never its current
# tags — and walks the tag tree from the top (economics, engineering, projects):
#   - at each level, one `noul` (yes/no) per child; a branch opens its children
#     only when its own noul passes the gate
#   - the tags that pass, less the top-level branches (they are only gates) and
#     any ancestor of another, are the candidates
#   - primary: one last `choice` among the candidates, for the first-position
#     tag the site reads as primary
#   - others: the rest of the candidates
#
# Nimble scores each question with the note and the whole question set in its
# prompt, and was trained on prompts up to 2,048 tokens, so small requests of a
# few siblings each answer far better than one request with every tag.
#
# Each note then shows a diff of the primary tag and of the other tags against
# what the note carries now, and one keypress applies both, either, or neither
# before the next note is read.
#
# Tags under OUT_OF_SCOPE are never suggested and never removed: a note keeps
# them, after the suggested tags, so an applied primary always goes first.
# Notes tagged private are skipped: they are reviewed in the private vault, not
# in their public copies.
#
# Usage:
#   utils/suggest-tags.sh [options] <file-or-directory>...
#
#   -m MODEL      decision model                     (default: nimble)
#   -H HOST       Ollama host                        (default: $OLLAMA_HOST, else http://localhost:11434)
#   -t THRESHOLD  noul probability to suggest a tag  (default: 0.6)
#   -g GATE       noul probability to open a branch  (default: 0.3)
#   -k MAX        at most MAX other tags             (default: 4)
#   -c CHARS      body characters sent               (default: 6000)
#   -n            dry run: show diffs, never prompt or write
#
# Run from anywhere; tags are gathered from the whole vault (content/).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_DIR="$(dirname "$SCRIPT_DIR")"
TAG_DESC_DIR="$VAULT_DIR/public/tags"

MODEL="nimble"
HOST="${OLLAMA_HOST:-http://localhost:11434}"
THRESHOLD="0.6"
GATE="0.3"
MAX_OTHERS=4
MAX_CHARS=6000
DRY_RUN=0

usage() { sed -n '/^# Usage:/,/^# Run from/p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while getopts "m:H:t:g:k:c:nh" opt; do
  case "$opt" in
    m) MODEL="$OPTARG" ;;
    H) HOST="$OPTARG" ;;
    t) THRESHOLD="$OPTARG" ;;
    g) GATE="$OPTARG" ;;
    k) MAX_OTHERS="$OPTARG" ;;
    c) MAX_CHARS="$OPTARG" ;;
    n) DRY_RUN=1 ;;
    h) usage 0 ;;
    *) usage 1 ;;
  esac
done
shift $((OPTIND - 1))
# Like the ollama CLI, accept a bare "host:port" and assume http.
case "$HOST" in *://*) ;; *) HOST="http://$HOST" ;; esac
HOST="${HOST%/}"
[ $# -gt 0 ] || usage 1

if [ -t 1 ]; then
  RED=$'\e[31m' GREEN=$'\e[32m' DIM=$'\e[2m' BOLD=$'\e[1m' RESET=$'\e[0m'
else
  RED="" GREEN="" DIM="" BOLD="" RESET=""
fi

WORK="$(mktemp -d)"
trap 'kill $(jobs -p) 2>/dev/null || true; rm -rf "$WORK"' EXIT

# Directories under content/ that hold no notes worth tagging (or gathering from).
PRUNE='-name dist -o -name node_modules -o -name .obsidian -o -name copilot -o -name templates -o -name tags -o -name .cache'

list_notes() {
  local target
  for target in "$@"; do
    if [ -d "$target" ]; then
      eval "find \"\$target\" \\( $PRUNE \\) -prune -o -type f -name '*.md' -print" | sort
    elif [ -f "$target" ]; then
      echo "$target"
    else
      echo "${RED}not found: $target${RESET}" >&2
    fi
  done
}

# ---------- frontmatter ----------

# The YAML between the leading --- fences (empty when there is none).
frontmatter() {
  awk 'NR==1 { if ($0 != "---") exit; next } $0 == "---" { exit } { print }' "$1"
}

# Everything after the frontmatter (the whole file when there is none).
body() {
  awk 'NR==1 && $0 == "---" { fm=1; next } fm && $0 == "---" { fm=0; next } !fm { print }' "$1"
}

# A scalar field from frontmatter on stdin; follows `|` / `>` block scalars.
field() {
  awk -v k="$1" '
    function unq(s) { if (s ~ /^".*"$/ || s ~ /^\x27.*\x27$/) s = substr(s, 2, length(s) - 2); return s }
    blk { if ($0 ~ /^[ \t]/ || $0 == "") { sub(/^[ \t]+/, ""); out = out (out == "" ? "" : " ") $0; next } exit }
    index($0, k ":") == 1 {
      v = substr($0, length(k) + 2); sub(/^[ \t]+/, "", v)
      if (v ~ /^[|>][-+]?$/) { blk = 1; next }
      print unq(v); exit
    }
    END { if (blk) print out }'
}

# Tags from frontmatter on stdin, one per line: list, inline [a, b] or scalar.
# With FNR resets it also reads many whole files at once (see gather_tags).
TAGS_AWK='
  function unq(s) { gsub(/^[ \t]+|[ \t]+$/, "", s); if (s ~ /^".*"$/ || s ~ /^\x27.*\x27$/) s = substr(s, 2, length(s) - 2); return s }
  FNR == 1 { fm = (multi ? ($0 == "---") : 1); intags = 0; if (multi) next }
  !fm { next }
  multi && $0 == "---" { fm = 0; next }
  intags { if ($0 ~ /^[ \t]*- /) { t = $0; sub(/^[ \t]*- /, "", t); print unq(t); next } intags = 0 }
  /^tags:/ {
    v = $0; sub(/^tags:[ \t]*/, "", v)
    if (v == "") { intags = 1; next }
    if (v ~ /^\[/) { gsub(/[][]/, "", v); n = split(v, a, ","); for (i = 1; i <= n; i++) if (unq(a[i]) != "") print unq(a[i]); next }
    print unq(v)
  }'

tags_of() { frontmatter "$1" | awk -v multi=0 "$TAGS_AWK"; }

# Top-level tags left out of the analysis. `writing` and `horticulture` say what
# kind of note it is or when it was written, not what it is about.
OUT_OF_SCOPE="private writing horticulture excalidraw"

is_out_of_scope() {
  local root
  for root in $OUT_OF_SCOPE; do
    case "$1" in "$root"|"$root"/*) return 0 ;; esac
  done
  return 1
}

# Rewrite a note's tags block in place, keeping the quoting style it used.
# $2 is a comma-separated tag list (tags never contain commas).
write_tags() {
  local file="$1" tags="$2" quote=0
  frontmatter "$file" | grep -qE '^(tags:[[:space:]]*\[?"|[[:space:]]*- ")' && quote=1
  awk -v tags="$tags" -v q="$quote" '
    function emit(   n, a, i) {
      print "tags:"
      n = split(tags, a, ",")
      for (i = 1; i <= n; i++) print "  - " (q ? "\"" a[i] "\"" : a[i])
      done = 1
    }
    NR == 1 && $0 == "---" { fm = 1; print; next }
    fm && skip { if ($0 ~ /^[ \t]*- /) next; skip = 0 }
    fm && $0 == "---" { if (!done) emit(); fm = 0; print; next }
    fm && /^tags:/ { emit(); v = $0; sub(/^tags:[ \t]*/, "", v); if (v == "") skip = 1; next }
    { print }
  ' "$file" > "$WORK/rewrite" && cat "$WORK/rewrite" > "$file"
}

# ---------- vocabulary ----------

# First paragraph of a tag's description page, flattened, or empty.
tag_description() {
  local f="$TAG_DESC_DIR/$1.md"
  [ -f "$f" ] || return 0
  body "$f" | awk 'NF { p = p " " $0; next } p != "" { exit } END { print p }' \
    | sed -E 's/\[\[[^]|]*\|([^]]*)\]\]/\1/g; s/\[\[([^]]*)\]\]/\1/g; s/`//g; s/^ +//' \
    | cut -c1-240
}

# Every in-scope tag used by any note in the vault, as "tag<TAB>description".
gather_tags() {
  list_notes "$VAULT_DIR" | tr '\n' '\0' | xargs -0 awk -v multi=1 "$TAGS_AWK" \
    | sort -u | while IFS= read -r tag; do
        [ -n "$tag" ] && ! is_out_of_scope "$tag" || continue
        printf '%s\t%s\n' "$tag" "$(tag_description "$tag")"
      done
}

# ---------- model ----------

# A `choice` takes at most this many candidates.
MAX_CHOICES=26

# The tag tree as "node<TAB>parent<TAB>is_tag<TAB>description": every in-scope
# tag and each of its ancestors (engineering/languages is a node, not a tag).
# Top-level nodes have an empty parent.
build_tree() {
  cut -f1 "$WORK/tags.tsv" | awk -F/ '{ p = ""; for (i = 1; i <= NF; i++) { p = p (i > 1 ? "/" : "") $i; print p } }' \
    | sort -u | while IFS= read -r node; do
        parent=""; case "$node" in */*) parent="${node%/*}" ;; esac
        is_tag=0; cut -f1 "$WORK/tags.tsv" | grep -Fqx -- "$node" && is_tag=1
        printf '%s\t%s\t%s\t%s\n' "$node" "$parent" "$is_tag" "$(tag_description "$node")"
      done
}

# Children of node $1 ("" for the top level), as tree lines.
children() { awk -F'\t' -v p="$1" '$2 == p' "$WORK/tree.tsv"; }

has_children() { [ -n "$(children "$1")" ]; }

# A `noul` about each child of a node, on stdin as tree lines, keyed k0, k1, ….
level_questions() {
  jq -Rn '
    [inputs | split("\t") | {tag: .[0], desc: .[3]}] as $kids
    | ($kids | to_entries | map({
        key: "k\(.key)",
        value: {
          type: "noul",
          instructions: ("Is this note meaningfully about \"\(.value.tag)\"?"
            + (if .value.desc == "" then "" else " It covers: \(.value.desc)" end))
        }
      }) | from_entries)'
}

# The primary `choice` among candidate tags, on stdin as tree lines.
primary_question() {
  jq -Rn '
    {primary: {
      type: "choice",
      instructions: "Which ONE of these best describes what this note is primarily about?",
      criteria: ([inputs | split("\t") | {key: .[0], value: (if .[3] == "" then .[0] else .[3] end)}] | from_entries)
    }}'
}

ensure_model() {
  local models
  if ! models="$(curl -fsS -m 5 "$HOST/api/tags" 2>/dev/null)"; then
    echo "${RED}Ollama is not reachable at $HOST${RESET} (set -H or \$OLLAMA_HOST)" >&2
    exit 1
  fi
  if [ "$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$HOST/v1/systemone" -d '{}')" = 404 ]; then
    echo "${RED}$HOST has no /v1/systemone endpoint${RESET} — decision models need a newer Ollama" >&2
    exit 1
  fi
  if ! echo "$models" | jq -e --arg m "$MODEL" '.models[].name | select(. == $m or startswith($m + ":"))' >/dev/null; then
    ( exec </dev/tty ) 2>/dev/null || {
      echo "${RED}$MODEL is not on $HOST${RESET}; pull it with: OLLAMA_HOST=$HOST ollama pull $MODEL" >&2
      exit 1
    }
    printf '%s is not on %s. Pull it now? [y/N] ' "$MODEL" "$HOST"
    read -r ans </dev/tty
    [ "$ans" = "y" ] || exit 1
    curl -sS "$HOST/api/pull" -d "{\"model\":\"$MODEL\"}" \
      | jq -r 'if .error then "error: \(.error)" else .status end' | uniq | tee "$WORK/pull"
    grep -q '^error:' "$WORK/pull" && exit 1
  fi
}

# POSTs the note's state in $1 with the questions in $2; the answers go to $3.
request() {
  jq -n --arg model "$MODEL" --slurpfile state "$1/state.json" --slurpfile questions "$2" \
    '{model: $model, state: $state[0], questions: $questions[0]}' > "$1/request.json"
  curl -sS "$HOST/v1/systemone" -H 'Content-Type: application/json' -d @"$1/request.json" > "$3"
  if jq -e '.error' "$3" >/dev/null 2>&1; then jq -r '.error' "$3" >&2; return 1; fi
}

# Walks the tag tree for one note, breadth first, one request per opened node,
# then asks for the primary among the candidates. Leaves "tag<TAB>p" lines in
# $2/candidates.tsv, the primary's first, its p from the choice, the others'
# from their nouls.
ask() {
  local file="$1" dir="$2" fm node n
  fm="$(frontmatter "$file")"
  body "$file" > "$dir/body.txt"
  jq -n \
    --arg title "$(echo "$fm" | field title)" \
    --arg description "$(echo "$fm" | field description)" \
    --rawfile content "$dir/body.txt" \
    --argjson chars "$MAX_CHARS" \
    '{title: $title, description: $description, content: $content[:$chars]}' > "$dir/state.json"

  : > "$dir/nouls.tsv"
  printf '\n' > "$dir/queue"   # the top level, as the empty node
  n=0
  while [ "$n" -lt "$(wc -l < "$dir/queue")" ]; do
    n=$((n + 1))
    node="$(sed -n "${n}p" "$dir/queue")"
    children "$node" > "$dir/kids.tsv"
    level_questions < "$dir/kids.tsv" > "$dir/questions.json"
    request "$dir" "$dir/questions.json" "$dir/answers.json" || return 1
    jq -r --rawfile kids "$dir/kids.tsv" '
      ($kids | rtrimstr("\n") | split("\n") | map(split("\t")[0])) as $k
      | .answers | to_entries[] | "\($k[.key[1:] | tonumber])\t\(.value.noul)"' "$dir/answers.json" \
      | tee -a "$dir/nouls.tsv" \
      | awk -F'\t' -v g="$GATE" '$2 >= g { print $1 }' \
      | while IFS= read -r kid; do has_children "$kid" && echo "$kid"; done >> "$dir/queue" || true
  done

  # Candidates: passing tags below the top level, less any ancestor of another.
  # With none, there is no suggestion; best.tsv keeps the best guess to show.
  awk -F'\t' 'NR == FNR { if ($3 == 1 && $2 != "") tag[$1] = 1; next } ($1 in tag)' \
    "$WORK/tree.tsv" "$dir/nouls.tsv" | sort -t$'\t' -k2 -gr > "$dir/scored.tsv"
  awk -F'\t' -v th="$THRESHOLD" '$2 >= th' "$dir/scored.tsv" \
    | awk -F'\t' '{ t[NR] = $1; line[NR] = $0 }
        END { for (i = 1; i <= NR; i++) { keep = 1
                for (j = 1; j <= NR; j++) if (index(t[j], t[i] "/") == 1) keep = 0
                if (keep) print line[i] } }' > "$dir/passing.tsv"
  head -1 "$dir/scored.tsv" > "$dir/best.tsv"

  if [ "$(wc -l < "$dir/passing.tsv")" -lt 2 ]; then
    cp "$dir/passing.tsv" "$dir/candidates.tsv"
    return
  fi
  awk -F'\t' 'NR == FNR { want[$1] = 1; next } ($1 in want)' "$dir/passing.tsv" "$WORK/tree.tsv" \
    | primary_question > "$dir/questions.json"
  request "$dir" "$dir/questions.json" "$dir/answers.json" || return 1
  jq -r '.answers.primary | "\(.choice)\t\(.probabilities[.choice])"' "$dir/answers.json" > "$dir/candidates.tsv"
  awk -F'\t' -v p="$(cut -f1 "$dir/candidates.tsv")" '$1 != p' "$dir/passing.tsv" >> "$dir/candidates.tsv"
}

# "tag<TAB>p" lines: the primary first, then at most MAX_OTHERS others.
suggestions() {
  awk -F'\t' -v k="$MAX_OTHERS" 'NR <= k + 1 { printf "%s\t%.2f\n", $1, $2 }' "$1/candidates.tsv"
}

# ---------- review ----------

# One keypress for the whole note. $1 lists the keys on offer besides n and q
# (y alone, or y/p/o when both diffs changed). Prints the key chosen.
respond() {
  local keys="$1" ans hint
  case "$keys" in
    y) hint="y apply · n skip · q quit" ;;
    *) hint="y apply both · p primary only · o others only · n skip · q quit" ;;
  esac
  while :; do
    printf '  Apply? %s[%s]%s ' "$DIM" "$hint" "$RESET" >&2
    ans=""; read -r -n1 ans </dev/tty || true
    echo >&2
    ans="$(printf '%s' "$ans" | tr '[:upper:]' '[:lower:]')"
    case "$ans" in
      q) echo "Stopped." >&2; exit 0 ;;
      n|"") echo n; return ;;
      *) case "$keys" in *"$ans"*) echo "$ans"; return ;; esac ;;
    esac
  done
}

# Prints a set diff of two newline lists: kept (dim), removed (-), added (+).
set_diff() {
  local old="$1" new="$2" scores="$3" t
  while IFS= read -r t; do
    [ -n "$t" ] || continue
    if printf '%s\n' "$new" | grep -Fqx -- "$t"; then echo "      ${DIM}  $t${RESET}"
    else echo "      ${RED}- $t${RESET}"; fi
  done <<< "$old"
  while IFS= read -r t; do
    [ -n "$t" ] || continue
    printf '%s\n' "$old" | grep -Fqx -- "$t" && continue
    echo "      ${GREEN}+ $t${RESET} ${DIM}($(printf '%s\n' "$scores" | awk -F'\t' -v t="$t" '$1 == t { print $2 }'))${RESET}"
  done <<< "$new"
}

# Shows the diff for a note whose answers are in directory $2, and applies the
# response.
review() {
  local file="$1" dir="$2" current kept cur_primary cur_others new_primary new_others scores
  local final_primary final_others primary_changed others_changed keys t

  # The current primary is the note's first tag, in scope or not, as the site
  # reads it; the others are the rest of its in-scope tags.
  current="$(tags_of "$file" | awk 'NF && !seen[$0]++')"
  cur_primary="$(printf '%s\n' "$current" | sed -n 1p)"
  kept="$(printf '%s\n' "$current" | while IFS= read -r t; do is_out_of_scope "$t" && echo "$t"; done || true)"
  cur_others="$(printf '%s\n' "$current" | sed 1d | while IFS= read -r t; do is_out_of_scope "$t" || echo "$t"; done || true)"

  if [ "$(cat "$dir/status")" != 0 ]; then
    echo "  ${RED}request failed:${RESET} $(cat "$dir/err")"
    return
  fi
  scores="$(suggestions "$dir")"
  if [ -z "$scores" ]; then
    echo "  ${DIM}no confident suggestion$(awk -F'\t' '{ printf " (best guess: %s %.2f)", $1, $2 }' "$dir/best.tsv"); tags left as they are${RESET}"
    return
  fi
  new_primary="$(printf '%s\n' "$scores" | sed -n 1p | cut -f1)"
  new_others="$(printf '%s\n' "$scores" | sed 1d | cut -f1)"

  primary_changed=0; [ "$cur_primary" != "$new_primary" ] && primary_changed=1
  # A current other the model picks as primary moves up rather than out, so it
  # leaves the others diff.
  cur_others="$(printf '%s\n' "$cur_others" | grep -Fvx -- "$new_primary" || true)"
  others_changed=0
  [ "$(printf '%s\n' "$cur_others" | sort)" != "$(printf '%s\n' "$new_others" | sort)" ] && others_changed=1

  echo "    ${BOLD}primary${RESET}"
  if [ $primary_changed = 1 ] && is_out_of_scope "$cur_primary"; then
    echo "      ${RED}- $cur_primary${RESET} ${DIM}(kept, after the suggested tags)${RESET}"
    set_diff "" "$new_primary" "$scores"
  else
    set_diff "$cur_primary" "$new_primary" "$scores"
  fi
  echo "    ${BOLD}others${RESET}"
  set_diff "$cur_others" "$new_others" "$scores"

  if [ $primary_changed = 0 ] && [ $others_changed = 0 ]; then
    echo "  ${GREEN}✓ matches${RESET}"; return
  fi
  [ $DRY_RUN = 1 ] && return

  final_primary="$cur_primary"; final_others="$cur_others"
  if [ $primary_changed = 1 ] && [ $others_changed = 1 ]; then keys="ypo"; else keys="y"; fi
  case "$(respond "$keys")" in
    y) [ $primary_changed = 1 ] && final_primary="$new_primary"
       [ $others_changed = 1 ] && final_others="$new_others" ;;
    p) final_primary="$new_primary" ;;
    # Others only: the suggested primary still belongs on the note, after it.
    o) final_others="$(printf '%s\n%s\n' "$new_primary" "$new_others")" ;;
    *) echo "  ${DIM}skipped${RESET}"; return ;;
  esac

  # Primary first, then the others (without the primary or an ancestor of a
  # kept tag, as a mix of old and new can leave), then out-of-scope tags in the
  # order the note had them.
  write_tags "$file" "$(
    { echo "$final_primary"; printf '%s\n' "$final_others" | grep -Fvx -- "$final_primary"; echo "$kept"; } \
      | awk 'NF && !seen[$0]++ { t[++n] = $0 }
             END { for (i = 1; i <= n; i++) { keep = 1
                     for (j = 1; j <= n; j++) if (index(t[j], t[i] "/") == 1) keep = 0
                     if (keep) print t[i] } }' \
      | paste -sd, -
  )"
  echo "  ${GREEN}written${RESET}"
}

# ---------- main ----------

ensure_model

gather_tags > "$WORK/tags.tsv"
build_tree > "$WORK/tree.tsv"
widest="$(cut -f2 "$WORK/tree.tsv" | sort | uniq -c | sort -rn | awk 'NR == 1 { print $1 }')"
if [ "$widest" -gt "$MAX_CHOICES" ]; then
  echo "${RED}a tag has $widest children; a choice takes at most $MAX_CHOICES${RESET}" >&2
  exit 1
fi
echo "${DIM}$(wc -l < "$WORK/tags.tsv" | tr -d ' ') tags in $(children "" | wc -l | tr -d ' ') branches · $MODEL @ $HOST · suggest ≥ $THRESHOLD, open ≥ $GATE${RESET}"

# A note tagged private is reviewed in the private vault, not in its public
# copy, so the loop passes over it.
notes=()
skipped_private=0
while IFS= read -r file; do
  if [ -z "$(frontmatter "$file")" ]; then
    echo "${DIM}$file — no frontmatter, skipped${RESET}"
  elif tags_of "$file" | grep -qE '^private(/|$)'; then
    skipped_private=$((skipped_private + 1))
  else
    notes+=("$file")
  fi
done < <(list_notes "$@")
total=${#notes[@]}
[ "$skipped_private" = 0 ] || echo "${DIM}$skipped_private note(s) tagged private, skipped${RESET}"

# Asks about note $1 in the background; its answers land in $WORK/$1, with the
# exit status in status once they are all there.
prefetch() {
  mkdir -p "$WORK/$1"
  ( st=0; ask "${notes[$1]}" "$WORK/$1" 2>"$WORK/$1/err" || st=$?
    echo "$st" > "$WORK/$1/status.tmp" && mv "$WORK/$1/status.tmp" "$WORK/$1/status" ) </dev/null &
  pids[$1]=$!
}

# One note ahead: while a note's diff waits on the reviewer, the next note's
# requests are already running.
pids=()
[ "$total" -gt 0 ] && prefetch 0
i=0
while [ "$i" -lt "$total" ]; do
  echo
  echo "${BOLD}[$((i + 1))/$total] ${notes[$i]}${RESET}"
  if [ ! -f "$WORK/$i/status" ] && [ -t 1 ]; then
    printf '  %sasking %s…%s' "$DIM" "$MODEL" "$RESET"
    wait "${pids[$i]}" || true
    printf '\r\033[K'
  fi
  wait "${pids[$i]}" 2>/dev/null || true
  [ $((i + 1)) -lt "$total" ] && prefetch $((i + 1))
  review "${notes[$i]}" "$WORK/$i"
  rm -rf "${WORK:?}/$i"
  i=$((i + 1))
done
