import { test } from "node:test";
import assert from "node:assert/strict";
import { runFlow, type FlowState } from "@/lib/chatbot/engine";
import { defaultFlowGraph, toFlowGraph, type FlowGraph } from "@/lib/chatbot/types";

const graph = defaultFlowGraph();

test("new conversation emits welcome + options and awaits", async () => {
  const r = await runFlow(graph, null, "hola");
  assert.equal(r.state.awaiting, "options");
  assert.ok(r.replies.join(" ").includes("Hola"));
  assert.equal(r.ended, false);
});

test("picking an option follows its branch (opt-2 → handoff)", async () => {
  const first = await runFlow(graph, null, "hola");
  const r = await runFlow(graph, first.state, "Hablar con alguien");
  assert.equal(r.ended, true); // handoff ends the bot
});

test("unmatched option re-prompts and keeps state", async () => {
  const first = await runFlow(graph, null, "hola");
  const r = await runFlow(graph, first.state, "xyz no existe");
  assert.equal(r.state.awaiting, "options");
  assert.equal(r.ended, false);
});

test("ai node calls the ai function and continues", async () => {
  const g: FlowGraph = {
    nodes: [
      { id: "start", type: "start", x: 0, y: 0 },
      { id: "a", type: "ai", x: 0, y: 0, text: "responde" },
      { id: "m", type: "message", x: 0, y: 0, text: "¿algo más?" },
    ],
    edges: [
      { id: "e1", source: "start", target: "a", sourceHandle: "out" },
      { id: "e2", source: "a", target: "m", sourceHandle: "out" },
    ],
  };
  const first = await runFlow(g, null, "hola"); // reaches ai, awaits
  assert.equal(first.state.awaiting, "ai");
  const r = await runFlow(g, first.state, "¿precio?", { ai: async () => "Cuesta $100" });
  assert.ok(r.replies.includes("Cuesta $100"));
  assert.ok(r.replies.includes("¿algo más?"));
});

test("action 'tag' runs side effect and continues; 'close' ends", async () => {
  const g: FlowGraph = {
    nodes: [
      { id: "start", type: "start", x: 0, y: 0 },
      { id: "t", type: "action", x: 0, y: 0, action: "tag", text: "vip" },
      { id: "c", type: "action", x: 0, y: 0, action: "close" },
    ],
    edges: [
      { id: "e1", source: "start", target: "t", sourceHandle: "out" },
      { id: "e2", source: "t", target: "c", sourceHandle: "out" },
    ],
  };
  const tags: string[] = [];
  const r = await runFlow(g, null, "hola", { onAction: async (a, txt) => { if (a === "tag" && txt) tags.push(txt); } });
  assert.deepEqual(tags, ["vip"]);
  assert.equal(r.ended, true);
});

test("toFlowGraph converts legacy blocks", () => {
  const fg = toFlowGraph({ blocks: [{ id: "b1", type: "message", text: "hi" }] });
  assert.ok(fg.nodes.some((n) => n.type === "start"));
  assert.ok(fg.nodes.some((n) => n.text === "hi"));
  assert.ok(fg.edges.length >= 1);
});

// keep a reference so the import is used even if a test above is skipped
const _s: FlowState = { nodeId: null, awaiting: "none" };
assert.equal(_s.awaiting, "none");
