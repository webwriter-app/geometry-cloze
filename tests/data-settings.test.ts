/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { block, children, cleanup, mount, shown, snippet, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("<ww-geometry-cloze> data, settings and localization", function () {
  afterEach(cleanup);

  describe("data block", function () {
    it("moves an outside change of the data block to the canvas", async function () {
      const el = await mount(false);
      block(el)!.textContent = JSON.stringify({ elements: [] });
      await until(() => shown(el).length === 0, "the canvas to empty");
      block(el)!.textContent = snippet.match(/slot="data">(.*?)<\/script>/s)![1];
      await until(() => shown(el).length > 0, "the canvas to refill");
    });
    it("creates a data block with slot=data on the first change of an empty widget", async function () {
      const host = document.createElement("div");
      host.className = "test-mount";
      host.innerHTML = "<ww-geometry-cloze></ww-geometry-cloze>";
      document.body.append(host);
      const empty = host.firstElementChild as any;
      await until(() => empty.manager, "manager");
      empty.manager.import({ children: [{ _type: "element", id: 1, children: [{ _type: "point", id: 2, x: 100, y: 100 }] }] });
      empty.manager.requestRedraw();
      await until(() => block(empty) && children(empty).length === 1, "the block to appear");
      assert.equal(block(empty)!.getAttribute("type"), "application/json");
      assert.equal(block(empty)!.getAttribute("slot"), "data");
      assert.isFalse(block(empty)!.hasAttribute("src"));
    });
  });

  describe("settings", function () {
    let el: any;
    beforeEach(async function () {
      el = await mount(false);
    });

    it("keeps their attribute names", async function () {
      el.hideGrid = true;
      el.disableSnapping = true;
      el.abstractRightAngle = true;
      el.scale = 2;
      await el.updateComplete;
      assert.isTrue(el.hasAttribute("hidegrid"));
      assert.isTrue(el.hasAttribute("disablesnapping"));
      assert.isTrue(el.hasAttribute("abstractrightangle"));
      assert.equal(el.getAttribute("scale"), "2");
    });
    it("reaches the canvas", async function () {
      el.hideGrid = true;
      el.disableSnapping = true;
      el.abstractRightAngle = true;
      el.scale = 2;
      await el.updateComplete;
      assert.isFalse(el.manager.showGrid);
      assert.isFalse(el.manager.snapping);
      assert.isTrue(el.manager.abstractRightAngle);
      assert.equal(el.manager.scaleFactor, 2);
    });
    it("sets the properties from attributes in a document", async function () {
      el.hideGrid = true;
      await el.updateComplete;
      el.removeAttribute("hidegrid");
      el.setAttribute("scale", "0.75");
      await el.updateComplete;
      assert.isFalse(el.hideGrid);
      assert.equal(el.scale, 0.75);
      assert.isTrue(el.manager.showGrid);
      assert.equal(el.manager.scaleFactor, 0.75);
    });
    it("writes no attribute for the default scale", async function () {
      el.scale = 2;
      await el.updateComplete;
      el.scale = 1;
      await el.updateComplete;
      assert.isFalse(el.hasAttribute("scale"));
    });
    it("carries the attribute and the control in the editor options", function () {
      const o = el.options;
      assert.equal(o.hideGrid.attribute, "hidegrid");
      assert.equal(o.scale.control, "range");
      assert.equal(o.scale.steps.length, 11);
      assert.equal(o.disableSnapping.attribute, "disablesnapping");
      assert.equal(o.abstractRightAngle.attribute, "abstractrightangle");
      assert.equal(o.hideGrid.label, "Hide grid");
    });
  });

  describe("localization", function () {
    it("translates option labels and the toolbar with the language of the widget", async function () {
      const el = await mount(true, "de");
      await until(() => el.options.hideGrid.label !== "Hide grid", "the German catalog");
      assert.notEqual(el.options.scale.label, "Scale");
      assert.notEqual(el.options.hideGrid.label, "Hide grid");
    });
    it("sends optionschange for the drawer on a language change", async function () {
      const el = await mount(false);
      let seen = 0;
      el.addEventListener("optionschange", () => seen++);
      el.setAttribute("lang", "fr");
      await until(() => seen > 0 && el.options.hideGrid.label !== "Hide grid", "optionschange");
    });
    it("renders the toolbar in the language of the widget", async function () {
      const el = await mount(true);
      const toolbar = el.shadowRoot.querySelector("ww-geom-toolbar");
      await toolbar.updateComplete;
      const english = toolbar.shadowRoot.innerHTML;
      el.setAttribute("lang", "de");
      await until(() => toolbar.shadowRoot.innerHTML !== english, "the toolbar to render in German");
    });
  });

  describe("lifecycle", function () {
    it("leaves no listeners behind after removal", async function () {
      const el = await mount(true);
      el.remove();
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true, composed: true, cancelable: true }));
      assert.isNull(el.manager);
    });
  });

  describe("drawing", function () {
    it("draws once per frame when a shape moves", async function () {
      const el = await mount(false);
      const manager = el.manager;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      let draws = 0;
      const ctx = el.shadowRoot.querySelector("canvas").getContext("2d");
      const clearRect = ctx.clearRect;
      ctx.clearRect = function (...args: number[]) {
        draws++;
        return clearRect.apply(this, args);
      };
      manager.getChildren()[0].move({ x: 10, y: 10, relative: true });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      ctx.clearRect = clearRect;
      assert.isAtLeast(draws, 1);
      assert.isAtMost(draws, 2);
    });
  });
});

mocha.run();
