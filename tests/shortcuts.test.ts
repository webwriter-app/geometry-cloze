/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { block, children, cleanup, key, mount, shown, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("<ww-geometry-cloze> shortcuts", function () {
  afterEach(cleanup);

  describe("read mode", function () {
    let el: any;
    beforeEach(async function () {
      el = await mount(false);
    });

    it("shows no toolbar and an inert canvas", function () {
      assert.isNull(el.shadowRoot.querySelector("ww-geom-toolbar"));
      assert.isTrue(el.shadowRoot.querySelector("canvas").inert);
    });
    it("loads the data block into the canvas", function () {
      assert.equal(shown(el).length, children(el).length);
      assert.isAbove(children(el).length, 0);
    });
    it("ignores shortcuts for readers", async function () {
      el.manager.mode = "select";
      key(el, { key: "c" });
      await el.updateComplete;
      assert.equal(el.mode, "select");
      assert.equal(el.manager.mode, "select");
    });
    it("keeps a key in the widget out of the editor", function () {
      assert.isTrue(key(el, { key: "x" }).defaultPrevented);
    });
  });

  describe("edit mode", function () {
    let el: any;
    beforeEach(async function () {
      el = await mount(true);
    });

    it("shows the toolbar and an interactive canvas", function () {
      assert.isNotNull(el.shadowRoot.querySelector("ww-geom-toolbar"));
      assert.isFalse(el.shadowRoot.querySelector("canvas").inert);
    });
    it("switches to create on c and reflects it on the host", async function () {
      key(el, { key: "c" });
      await until(() => el.getAttribute("mode") === "create", "mode attribute");
      assert.equal(el.manager.mode, "create");
    });
    it("switches to divider on d", async function () {
      key(el, { key: "d" });
      await until(() => el.manager.mode === "divider", "divider mode");
    });
    it("returns from divider to select on Escape", async function () {
      key(el, { key: "d" });
      await until(() => el.manager.mode === "divider", "divider mode");
      key(el, { key: "Escape" });
      await until(() => el.manager.mode === "select", "select mode");
    });
    it("switches to select on s", async function () {
      el.manager.mode = "create";
      key(el, { key: "s" });
      await until(() => el.manager.mode === "select", "select mode");
    });
    it("keeps a matched key from the editor", function () {
      assert.isTrue(key(el, { key: "c" }).defaultPrevented);
    });
    it("leaves Ctrl+Z to the editor", function () {
      assert.isFalse(key(el, { key: "z", ctrlKey: true }).defaultPrevented);
    });
    it("does not treat keys typed in the toolbar as shortcuts", async function () {
      el.manager.mode = "select";
      const toolbar = el.shadowRoot.querySelector("ww-geom-toolbar");
      const button = toolbar.shadowRoot.querySelector("sl-button");
      button.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true, composed: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.equal(el.manager.mode, "create");
    });
    it("passes modifier keys to the manager for snapping", function () {
      key(el, { key: "Alt", altKey: true, shiftKey: true });
      const keys = el.manager.keys;
      el.shadowRoot.querySelector("canvas").dispatchEvent(new KeyboardEvent("keyup", { key: "Alt", bubbles: true, composed: true }));
      assert.isTrue(keys.alt);
      assert.isTrue(keys.shift);
      assert.isFalse(el.manager.keys.alt);
    });
    it("selects everything on Shift+A, clears on Escape and removes on Delete", async function () {
      el.manager.mode = "select";
      const before = children(el).length;
      key(el, { key: "A", shiftKey: true });
      assert.isAbove(el.manager.selected.length, 0, "nothing was selected");
      key(el, { key: "Escape" });
      assert.equal(el.manager.selected.length, 0, "selection stayed");
      key(el, { key: "A", shiftKey: true });
      key(el, { key: "Delete" });
      await until(() => children(el).length === 0, "the data block to be emptied");
      assert.isAbove(before, 0);
    });
    it("runs a shortcut as one undo transaction", async function () {
      const seen: string[] = [];
      for (const type of ["ww-transactionstart", "ww-transactionend"]) el.addEventListener(type, () => seen.push(type), true);
      key(el, { key: "d" });
      await until(() => seen.length >= 2, "the transaction events");
      assert.equal(seen[0], "ww-transactionstart");
      assert.equal(seen.at(-1), "ww-transactionend");
    });
    it("writes canvas changes to the same single data block", function () {
      const scripts = el.querySelectorAll(":scope > script");
      assert.strictEqual(block(el), scripts.item(0));
      assert.equal(scripts.length, 1);
    });
  });
});

mocha.run();
