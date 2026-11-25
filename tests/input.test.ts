/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { cleanup, key, mount, shown, until } from "./helpers";

mocha.setup(getMochaConfig());

/** Sends a pointer event at a position of the 1000 x 700 canvas, with the given pointer type. */
function pointer(el: any, type: string, x: number, y: number, pointerType = "touch", init: PointerEventInit = {}) {
  const canvas = el.shadowRoot.querySelector("canvas") as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  canvas.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      pointerId: 7,
      pointerType,
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: rect.left + (x / 1000) * rect.width,
      clientY: rect.top + (y / 700) * rect.height,
      ...init
    })
  );
}

const firstPoint = (el: any) => el.manager.getChildren()[0].getPoints()[0];
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("<ww-geometry-cloze> input, layout and theme", function () {
  afterEach(cleanup);

  describe("touch and pen", function () {
    let el: any;
    beforeEach(async function () {
      el = await mount(true);
      el.manager.mode = "select";
    });

    it("selects an object with a tap", function () {
      const point = firstPoint(el);
      pointer(el, "pointerdown", point.x, point.y);
      pointer(el, "pointerup", point.x, point.y);
      assert.include(el.manager.selected, point);
    });
    it("moves an object by dragging it with a finger", function () {
      const point = firstPoint(el);
      const { x, y } = point;
      pointer(el, "pointerdown", x, y);
      pointer(el, "pointermove", x + 50, y + 50);
      pointer(el, "pointermove", x + 100, y + 100);
      pointer(el, "pointerup", x + 100, y + 100);
      assert.equal(point.x, x + 100);
      assert.equal(point.y, y + 100);
    });
    it("draws a selection rectangle with a pen drag on empty canvas", function () {
      pointer(el, "pointerdown", 20, 20, "pen");
      pointer(el, "pointermove", 700, 600, "pen");
      pointer(el, "pointerup", 700, 600, "pen");
      assert.isAbove(el.manager.selected.length, 0);
    });
    it("handles a tap once, not as touch and mouse event both", function () {
      const point = firstPoint(el);
      pointer(el, "pointerdown", point.x, point.y);
      pointer(el, "pointerup", point.x, point.y);
      canvasMouse(el, "mousedown", point.x, point.y);
      canvasMouse(el, "mouseup", point.x, point.y);
      assert.include(el.manager.selected, point, "a compatibility mouse event toggled the selection");
    });
    it("stops a half-made shape on a long press, as the right click does", async function () {
      el.manager.mode = "create";
      pointer(el, "pointerdown", 800, 100);
      pointer(el, "pointerup", 800, 100);
      assert.isNotNull(el.manager.creatingShape);
      pointer(el, "pointerdown", 850, 300);
      await wait(650);
      pointer(el, "pointerup", 850, 300);
      assert.isNull(el.manager.creatingShape);
    });
    it("lets only the editing canvas take over touch gestures", async function () {
      assert.equal(getComputedStyle(el.shadowRoot.querySelector("canvas")).touchAction, "none");
      cleanup();
      const reader = await mount(false);
      assert.notEqual(getComputedStyle(reader.shadowRoot.querySelector("canvas")).touchAction, "none");
    });
  });

  describe("shape editing", function () {
    it("removes a point next to a reversed edge without retaining the removed point", async function () {
      const el = await mount(true);
      const shape = el.manager.getChildren()[0];
      const [start, removed, end] = shape.getPoints();
      const previousLine = shape
        .getLines()
        .find((line: any) => line.start === start && line.end === removed);
      assert.isOk(previousLine, "the preceding edge exists");

      previousLine.setStart(removed);
      previousLine.setEnd(start);
      shape.removePoint(removed);

      assert.isTrue(
        shape.getLines().some((line: any) => line.start === start && line.end === end),
        "the remaining vertices stay connected"
      );
      assert.notInclude(shape.getPoints(), removed, "the removed point is no longer part of the shape");
    });
  });

  describe("keyboard", function () {
    let el: any;
    beforeEach(async function () {
      el = await mount(true);
      el.manager.mode = "select";
    });

    it("steps through the objects with Page Down", function () {
      key(el, { key: "PageDown" });
      assert.equal(el.manager.selected.length, 1);
      const first = el.manager.selected[0];
      key(el, { key: "PageDown" });
      assert.notStrictEqual(el.manager.selected[0], first);
      key(el, { key: "PageUp" });
      assert.strictEqual(el.manager.selected[0], first);
    });
    it("moves the selected point with the arrow keys by one grid step", function () {
      const point = firstPoint(el);
      el.manager.select(point);
      const { x, y } = point;
      key(el, { key: "ArrowRight" });
      key(el, { key: "ArrowDown" });
      assert.equal(point.x, x + 50);
      assert.equal(point.y, y + 50);
      key(el, { key: "ArrowLeft", altKey: true });
      assert.equal(point.x, x + 40);
    });
    it("creates a shape with the cursor and Enter", async function () {
      const before = shown(el).length;
      el.manager.mode = "create";
      // The first arrow shows the cursor at the center; then it goes to the free right side.
      for (let i = 0; i < 9; i++) key(el, { key: "ArrowRight" });
      key(el, { key: "Enter" });
      key(el, { key: "ArrowDown" });
      key(el, { key: "ArrowDown" });
      key(el, { key: "Enter" });
      await until(() => shown(el).length === before + 1, "a new shape");
      assert.equal(el.manager.getChildren().at(-1).getPoints().length, 2);
    });
    it("leaves Tab to the browser", function () {
      assert.isFalse(key(el, { key: "Tab" }).defaultPrevented);
    });
    it("keeps Enter and Space for the toolbar buttons", function () {
      const button = el.shadowRoot.querySelector("ww-geom-toolbar").shadowRoot.querySelector("sl-button");
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true, cancelable: true });
      button.dispatchEvent(event);
      assert.isFalse(event.defaultPrevented);
    });
    it("names the toolbar and its buttons for assistive technology", async function () {
      const toolbar = el.shadowRoot.querySelector("ww-geom-toolbar");
      await toolbar.updateComplete;
      assert.equal(toolbar.getAttribute("role"), "toolbar");
      assert.isNotEmpty(toolbar.getAttribute("aria-label"));
      const buttons = [...toolbar.shadowRoot.querySelectorAll("sl-button")];
      for (const button of buttons) assert.isNotEmpty(button.textContent.trim(), "a button without a name");
    });
    it("announces the selection", async function () {
      key(el, { key: "PageDown" });
      await until(() => el.shadowRoot.querySelector("output").textContent.trim(), "an announcement");
    });
  });

  describe("layout", function () {
    for (const width of [300, 768, 2100]) {
      it(`fits a container ${width}px wide`, async function () {
        const el = await mount(true);
        const holder = el.parentElement as HTMLElement;
        holder.style.width = width + "px";
        await wait(100);
        assert.isAtMost(el.getBoundingClientRect().width, width + 0.5);
        const toolbar = el.shadowRoot.querySelector("ww-geom-toolbar");
        assert.isAtMost(toolbar.scrollWidth, toolbar.clientWidth + 1, "the toolbar overflows");
        const canvas = el.shadowRoot.querySelector("canvas");
        assert.isAtMost(canvas.getBoundingClientRect().width, width + 0.5);
      });
    }
  });

  describe("theme", function () {
    it("follows the document's text color, font and accent", async function () {
      const wrapper = document.createElement("div");
      wrapper.className = "test-mount";
      wrapper.style.cssText =
        "--ww-text-color: rgb(10, 20, 30); --ww-font-family: Georgia, serif; --ww-theme-accent-1: rgb(200, 50, 0);";
      document.body.append(wrapper);
      const el = await mount(true);
      wrapper.append(el.parentElement);
      await wait(50);
      const style = getComputedStyle(el);
      assert.equal(style.color, "rgb(10, 20, 30)");
      assert.include(style.fontFamily, "Georgia");
      assert.include(el.manager.fontFamily, "Georgia");
      assert.equal(el.manager.accentColor, "rgb(200, 50, 0)");
    });
    it("falls back to the Shoelace look without a theme", async function () {
      const el = await mount(false);
      assert.notInclude(el.manager.fontFamily, "Georgia");
      // The Shoelace theme stylesheet may apply after the widget loaded: wait for it, then compare.
      await until(() => getComputedStyle(document.documentElement).getPropertyValue("--sl-focus-ring-color").trim(), "the Shoelace theme");
      const ring = getComputedStyle(document.documentElement).getPropertyValue("--sl-focus-ring-color").trim();
      assert.equal(el.manager.accentColor, ring);
    });
    it("exposes the canvas as a part", async function () {
      const el = await mount(false);
      assert.equal(el.shadowRoot.querySelector("canvas").getAttribute("part"), "canvas");
    });
  });
});

describe("<ww-geometry-cloze> print", function () {
  afterEach(cleanup);

  it("prints the figure without selection and restores the selection afterwards", async function () {
    const el = await mount(true);
    const canvas = el.shadowRoot.querySelector("canvas") as HTMLCanvasElement;
    const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    el.manager.mode = "select";
    el.manager.select(el.manager.getChildren()[0]);
    await frame();
    const selected = canvas.toDataURL();
    window.dispatchEvent(new Event("beforeprint"));
    const printed = canvas.toDataURL();
    assert.notEqual(printed, selected, "the selection was printed");
    window.dispatchEvent(new Event("afterprint"));
    await frame();
    assert.equal(el.manager.selected.length, 1, "the selection was not restored");
    assert.equal(canvas.toDataURL(), selected);
    el.manager.blur();
    await frame();
    assert.equal(canvas.toDataURL(), printed, "the print differs from the unselected figure");
  });
});

function canvasMouse(el: any, type: string, x: number, y: number) {
  const canvas = el.shadowRoot.querySelector("canvas") as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  canvas.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      composed: true,
      clientX: rect.left + (x / 1000) * rect.width,
      clientY: rect.top + (y / 700) * rect.height
    })
  );
}

mocha.run();
