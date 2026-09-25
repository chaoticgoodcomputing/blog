// The reading-time package types its entry only; its counter, which the entry re-exports, is the
// same function.
declare module "reading-time/lib/reading-time" {
  import readingTime from "reading-time"
  export default readingTime
}
