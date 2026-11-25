/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import figure from "./fixtures/figure.json";
import { children, cleanup, mount, shown, until } from "./helpers";
import { readFigure } from "../src/model/figure-json";

mocha.setup(getMochaConfig());

const fixtureFile = (text = JSON.stringify(figure)) =>
  new File([text], "figure.json", { type: "application/json" });

describe("<ww-geometry-cloze> conversions", function () {
  afterEach(cleanup);

  it("declares the formats it converts", function () {
    const widget = customElements.get("ww-geometry-cloze") as any;
    assert.deepEqual(Object.keys(widget.convertFrom), [".json"]);
    assert.deepEqual(Object.keys(widget.convertTo), ["image/svg+xml", ".json", "img"]);
  });

  describe("SVG", function () {
    it("exports the objects without grid or selection", async function () {
      const el = await mount(false);
      const file = el.exportSvg() as File;
      assert.equal(file.type, "image/svg+xml");
      assert.match(file.name, /\.svg$/);
      const doc = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
      assert.isNull(doc.querySelector("parsererror"));
      assert.equal(doc.documentElement.getAttribute("viewBox"), "0 0 1000 700");
      assert.isAbove(doc.querySelectorAll("path").length, 4);
    });
    it("draws the labels as text and keeps dashes", async function () {
      const el = await mount(false);
      el.manager.import({ children: figure.elements });
      const doc = new DOMParser().parseFromString(await el.exportSvg().text(), "image/svg+xml");
      assert.isAbove(doc.querySelectorAll("text").length, 0);
      assert.isAbove(doc.querySelectorAll("[stroke-dasharray]").length, 0);
    });
    it("does not draw a selection", async function () {
      const el = await mount(false);
      const before = await el.exportSvg().text();
      el.manager.selectAll();
      assert.equal(await el.exportSvg().text(), before);
    });
    it("declines an empty canvas", async function () {
      const el = await mount(false);
      el.clear();
      await until(() => shown(el).length === 0, "the canvas to empty");
      assert.isNull(el.exportSvg());
      assert.isNull(el.toImage());
    });
  });

  describe("img", function () {
    it("converts to an img with an SVG data URL", async function () {
      const el = await mount(false);
      const image = el.toImage() as HTMLImageElement;
      assert.equal(image.localName, "img");
      assert.match(image.src, /^data:image\/svg\+xml/);
      assert.include(decodeURIComponent(image.src), "<svg");
      assert.isOk(image.alt);
      await image.decode();
      assert.equal(image.naturalWidth, 1000);
    });
  });

  describe("JSON", function () {
    it("reads a file and applies it only when asked", async function () {
      const el = await mount(false);
      const before = JSON.stringify(children(el));
      const apply = await el.importJson(fixtureFile());
      assert.equal(JSON.stringify(children(el)), before);
      apply();
      await until(() => children(el).length === 2, "the data block to change");
      await until(() => shown(el).length === 2, "the canvas to change");
    });
    it("accepts the list alone", async function () {
      const el = await mount(false);
      const apply = await el.importJson(fixtureFile(JSON.stringify(figure.elements)));
      apply();
      await until(() => children(el).length === 2, "the data block to change");
    });
    it("rejects files that are not a figure and leaves the widget alone", async function () {
      const el = await mount(false);
      const before = JSON.stringify(children(el));
      for (const text of ["not json", "{}", '{"elements":[{"_type":"circle","id":1}]}', '{"elements":[{"_type":"element","id":1,"children":[{"_type":"point","id":2}]}]}']) {
        let message = "";
        try {
          await el.importJson(fixtureFile(text));
        } catch (error) {
          message = (error as Error).message;
        }
        assert.isOk(message, text);
      }
      assert.equal(JSON.stringify(children(el)), before);
    });
    it("round-trips the figure", async function () {
      const el = await mount(false);
      (await el.importJson(fixtureFile()))();
      await until(() => shown(el).length === 2, "the canvas to change");
      const file = el.exportJson() as File;
      assert.equal(file.type, "application/json");
      assert.match(file.name, /\.json$/);
      const exported = JSON.parse(await file.text());
      const other = await mount(false);
      (await other.importJson(file))();
      await until(() => shown(other).length === 2, "the second canvas to change");
      assert.deepEqual(other.exportJson ? JSON.parse(await other.exportJson().text()) : null, exported);
    });
  });

  describe("clear", function () {
    it("is a confirmed danger action", function () {
      const action = (customElements.get("ww-geometry-cloze") as any).actions.clear;
      assert.equal(action.intent, "danger");
      assert.isOk(action.confirm);
    });
    it("empties the data block and the canvas", async function () {
      const el = await mount(true);
      el.clear();
      await until(() => children(el).length === 0 && shown(el).length === 0, "the figure to be gone");
    });
  });

  describe("readFigure", function () {
    it("tells syntax from shape errors", function () {
      assert.deepEqual(readFigure("{"), { error: "syntax" });
      assert.deepEqual(readFigure("[1]"), { error: "shape" });
      assert.isArray((readFigure("[]") as any).elements);
    });
  });
});

mocha.run();
