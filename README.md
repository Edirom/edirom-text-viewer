# Edirom Text Viewer Web Component

## Overview

The `edirom-text-viewer` is a Web Component used within the Edirom system to display HTML text content inside a scrollable container. It accepts pre-rendered HTML markup as an attribute, renders it into a Shadow DOM container, and intercepts any inline `loadLink(…)` click handlers in the rendered HTML, converting them into a `load-link` Custom Event that the host application can handle.

It supports two layout modes: `desktop` and `mobile`. The mobile template adds optimised typography, responsive image handling, and touch-friendly spacing.

## Features

- **HTML Rendering**: Accepts arbitrary HTML markup via the `html-data` attribute and renders it inside a scoped Shadow DOM container.
- **Responsive Layout**: `desktop` mode provides clean typographic defaults; `mobile` mode adds font-size tuning, responsive images, and compact padding.
- **`loadLink` Interception**: Scans rendered HTML for elements with `onclick="loadLink(…)"`, removes the inline handler, and re-emits a `load-link` Custom Event so the host application controls navigation.
- **Scroll to ID**: Supports smooth-scrolling to a named element inside the rendered content via the `scroll-to-id` attribute.

## Attributes

| Attribute      | Type                      | Default     | Description                                                                                                                              |
| -------------- | ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `layout-mode`  | `"desktop"` \| `"mobile"` | `"desktop"` | Switches the component template. `mobile` adds responsive typography and padding adjustments.                                            |
| `html-data`    | HTML string               | `""`        | The HTML markup to render inside the text container. Updated dynamically whenever the attribute changes.                                 |
| `scroll-to-id` | string                    | `null`      | ID of an element inside the rendered HTML to scroll to. Triggers a smooth `scrollIntoView` call. Can be set before or after `html-data`. |

---

### `layout-mode`

Controls which template and stylesheet the component applies.

**Possible Values:**

- `desktop` (default): Minimal styling with `16px` padding and standard line height.
- `mobile`: Adds `font-size: 1rem`, scaled heading sizes (`h1`–`h3`), link colour, and `max-width: 100%` on images.

---

### `html-data`

The HTML content to render. The component sets this string directly as `innerHTML` of the internal container, so it supports any valid HTML fragment including headings, paragraphs, links, images, and inline scripts.

After each render, the component runs `interceptLoadLinks` to replace `onclick="loadLink(…)"` handlers with `load-link` Custom Events.

**Example:**

```html
<edirom-text-viewer html-data="<h1>Title</h1><p>Some text content.</p>">
</edirom-text-viewer>
```

---

### `scroll-to-id`

When set, the component calls `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the element with the matching `id` inside the rendered HTML. The scroll is deferred with `requestAnimationFrame` to ensure the DOM has settled.

Setting this attribute before `html-data` is loaded stores the target ID; the scroll is then executed automatically after the content is rendered.

**Example:**

```html
<edirom-text-viewer
  html-data="<p id='section-2'>Second section</p>"
  scroll-to-id="section-2"
>
</edirom-text-viewer>
```

---

## Events

### `load-link`

Dispatched when the user clicks an element whose original `onclick` attribute contained a `loadLink(…)` call. The component removes the `onclick` attribute and replaces it with this event so the host application controls any navigation or resource loading.

**Bubbles:** yes  
**Composed:** yes (crosses Shadow DOM boundaries)

**Event Detail:**

```javascript
{
  plist: string;
}
```

The `plist` value is constructed from the original `loadLink(…)` arguments:

- If `loadLink("some/uri")` — `plist` is `"some/uri"`.
- If `loadLink("some/uri", { useExisting: true })` — `plist` is `"some/uri[useExisting:true]"` (the `{…}` config object is converted to the `[key:value]` bracket format expected by `parseTargets()`).

**Example:**

```javascript
document
  .querySelector("edirom-text-viewer")
  .addEventListener("load-link", (e) => {
    console.log("Load link requested:", e.detail.plist);
    // Parse plist and navigate / open the resource
  });
```

---

## Usage Example

```html
<script src="path/to/edirom-text-viewer.js"></script>

<edirom-text-viewer
  layout-mode="mobile"
  html-data="<h1>Introduction</h1><p>Welcome to the Edirom text viewer.</p>"
  scroll-to-id="intro"
>
</edirom-text-viewer>

<script>
  const viewer = document.querySelector("edirom-text-viewer");

  // Update content dynamically
  viewer.setAttribute(
    "html-data",
    "<h1 id='intro'>Introduction</h1><p>Updated content.</p>",
  );

  // Handle load-link events fired by inline loadLink() calls in the HTML
  viewer.addEventListener("load-link", (e) => {
    console.log("Navigation requested:", e.detail.plist);
  });
</script>
```
