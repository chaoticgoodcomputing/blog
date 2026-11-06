/**
 * Return the checkbox that toggles whether badge requests are sent.
 */
function badgeCheckbox() {
  return /** @type {HTMLInputElement} */ (document.getElementById('badge'));
}

/**
 * Return the checkbox that toggles whether a new tab turns Annotator on.
 */
function alwaysOnCheckbox() {
  return /** @type {HTMLInputElement} */ (document.getElementById('always-on'));
}

function saveOptions() {
  chrome.storage.sync.set({
    badge: badgeCheckbox().checked,
    alwaysOn: alwaysOnCheckbox().checked,
  });
}

function loadOptions() {
  chrome.storage.sync.get(
    {
      badge: true,
      alwaysOn: true,
    },
    items => {
      badgeCheckbox().checked = !!items.badge;
      alwaysOnCheckbox().checked = items.alwaysOn !== false;
    },
  );
}

document.addEventListener('DOMContentLoaded', loadOptions);
badgeCheckbox().addEventListener('click', saveOptions);
alwaysOnCheckbox().addEventListener('click', saveOptions);
