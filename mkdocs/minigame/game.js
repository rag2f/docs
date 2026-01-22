const INITIAL_STEPS = 20;

const state = {
  stepsRemaining: INITIAL_STEPS,
  selectedNode: null,
  completed: {
    spock: false,
    morpheus: false,
    johnny5: false,
    optimus: false,
    xfiles: false,
  },
  tourRunning: false,
};

const nodes = {
  spock: {
    title: "Spock",
    role: "Configuration manager for core + plugins.",
    desc: "Loads JSON + ENV config with a default shape and deterministic overrides.",
    path: "src/rag2f/core/spock/spock.py",
    snippet: `ENV_PREFIX = "RAG2F"
ENV_SEPARATOR = "__"

@staticmethod
def default_config() -> dict[str, Any]:
    return {"rag2f": {}, "plugins": {}}`,
    prereq: [],
  },
  morpheus: {
    title: "Morpheus",
    role: "Plugin and hook manager.",
    desc: "Discovers plugins from entry points and filesystem, then prioritizes entry points.",
    path: "src/rag2f/core/morpheus/morpheus.py",
    snippet: `try:
    discovered = entry_points(group="rag2f.plugins")
except TypeError:
    discovered = entry_points().get("rag2f.plugins", [])

# Entry points take precedence over filesystem plugins.`,
    prereq: ["spock"],
  },
  johnny5: {
    title: "Johnny5",
    role: "Input manager for foreground text.",
    desc: "Pipes inputs through Morpheus hooks and generates UUIDs when needed.",
    path: "src/rag2f/core/johnny5/johnny5.py",
    snippet: `id = self.rag2f.morpheus.execute_hook(
    "get_id_input_text", id, text, rag2f=self.rag2f
)
if id is None:
    id = uuid.uuid4().hex

done = self.rag2f.morpheus.execute_hook(
    "handle_text_foreground", done, id, text, rag2f=self.rag2f
)`,
    prereq: ["morpheus"],
  },
  optimus: {
    title: "OptimusPrime",
    role: "Embedder registry.",
    desc: "Validates Embedder protocol compliance and blocks unsafe overrides.",
    path: "src/rag2f/core/optimus_prime/optimus_prime.py",
    snippet: `if key in self._embedder_registry:
    if self._embedder_registry[key] is embedder:
        logger.warning(
            "Embedder '%s' already registered with the same instance; ...",
            key,
        )
        return
    raise ValueError(f"Override not allowed for already registered embedder: {key!r}")`,
    prereq: ["morpheus"],
  },
  xfiles: {
    title: "XFiles",
    role: "Repository registry.",
    desc: "Stores repository IDs with metadata. The truth is out there.",
    path: "src/rag2f/core/xfiles/xfiles.py",
    snippet: `@dataclass(slots=True)
class RepositoryEntry:
    id: str
    repository: BaseRepository
    meta: dict[str, Any] = field(default_factory=dict)

# "The truth is out there."`,
    prereq: ["optimus", "johnny5"],
  },
};

const stepEl = document.getElementById("stepsRemaining");
const bestEl = document.getElementById("bestScore");
const statusEl = document.getElementById("statusMessage");
const summaryEl = document.getElementById("summary");
const panelTitle = document.getElementById("panelTitle");
const panelDesc = document.getElementById("panelDesc");
const panelPath = document.getElementById("panelPath");
const panelSnippet = document.getElementById("panelSnippet");
const panelTask = document.getElementById("panelTask");
const resetBtn = document.getElementById("resetBtn");
const tourBtn = document.getElementById("tourBtn");

const nodeEls = document.querySelectorAll(".node");

function updateSteps() {
  stepEl.textContent = state.stepsRemaining;
  if (state.stepsRemaining <= 3) {
    stepEl.style.color = "var(--danger)";
  } else {
    stepEl.style.color = "inherit";
  }
}

function updateBestScore() {
  const best = localStorage.getItem("rag2f_best_steps");
  bestEl.textContent = best ? `${best} steps` : "--";
}

function setStatus(message, tone = "neutral") {
  statusEl.textContent = message;
  statusEl.style.color = tone === "success" ? "var(--success)" : tone === "danger" ? "var(--danger)" : "inherit";
}

function setNodeState() {
  nodeEls.forEach((node) => {
    const id = node.dataset.node;
    node.classList.toggle("node--done", state.completed[id]);
    node.classList.toggle("node--active", state.selectedNode === id);
    const locked = nodes[id].prereq.some((req) => !state.completed[req]);
    node.classList.toggle("node--locked", locked && !state.completed[id]);
  });
}

function useStep() {
  state.stepsRemaining -= 1;
  if (state.stepsRemaining < 0) {
    state.stepsRemaining = 0;
  }
  updateSteps();
  if (state.stepsRemaining <= 0) {
    setStatus("Boot sequence failed. Reset to try again.", "danger");
    panelTask.innerHTML = "";
  }
}

function selectNode(id) {
  state.selectedNode = id;
  const info = nodes[id];
  panelTitle.textContent = info.title;
  panelDesc.textContent = `${info.role} ${info.desc}`;
  panelPath.textContent = info.path;
  panelSnippet.textContent = info.snippet;
  renderTask(id);
  setNodeState();
}

function renderTask(id) {
  const info = nodes[id];
  if (state.stepsRemaining <= 0) {
    panelTask.innerHTML = "<p>Boot timer expired. Reset to try again.</p>";
    return;
  }
  const prereqMissing = info.prereq.filter((req) => !state.completed[req]);
  if (prereqMissing.length) {
    panelTask.innerHTML = `<p class="task-title">Locked</p><p>Activate ${prereqMissing.join(", ")} first.</p>`;
    return;
  }
  if (state.completed[id]) {
    panelTask.innerHTML = `<p class="task-title">Online</p><p>${info.title} is already active.</p>`;
    return;
  }

  if (id === "spock") {
    panelTask.innerHTML = `
      <p class="task-title">Spock boot quiz</p>
      <div class="task-row">
        <label>What is Spock’s main responsibility?</label>
        <label><input type="radio" name="spock-q1" value="a" /> Centralize configuration and merge multiple sources (env, files, defaults)</label>
        <label><input type="radio" name="spock-q1" value="b" /> Execute retrieval pipelines</label>
        <label><input type="radio" name="spock-q1" value="c" /> Store embeddings</label>
      </div>
      <div class="task-row">
        <label>Why does rag2f namespace configuration per plugin?</label>
        <label><input type="radio" name="spock-q2" value="a" /> To isolate plugin settings and avoid collisions</label>
        <label><input type="radio" name="spock-q2" value="b" /> To improve embedding speed</label>
        <label><input type="radio" name="spock-q2" value="c" /> To enforce a fixed pipeline</label>
      </div>
      <div class="task-row">
        <label>Why is configuration instance-scoped?</label>
        <label><input type="radio" name="spock-q3" value="a" /> Different rag2f instances may need isolated configs (tests, tenants, apps)</label>
        <label><input type="radio" name="spock-q3" value="b" /> Because env vars are global</label>
        <label><input type="radio" name="spock-q3" value="c" /> Because plugins cannot share state</label>
      </div>
      <div class="task-actions">
        <button class="btn" data-action="spock-submit">Activate Spock</button>
      </div>
    `;
  }

  if (id === "morpheus") {
    panelTask.innerHTML = `
      <p class="task-title">Morpheus discovery quiz</p>
      <div class="task-row">
        <label>What does Morpheus manage?</label>
        <label><input type="radio" name="morpheus-q1" value="a" /> Plugin discovery, loading, and hook orchestration</label>
        <label><input type="radio" name="morpheus-q1" value="b" /> Vector similarity search</label>
        <label><input type="radio" name="morpheus-q1" value="c" /> Tokenization</label>
      </div>
      <div class="task-row">
        <label>Why are entry-point plugins resolved before filesystem plugins?</label>
        <label><input type="radio" name="morpheus-q2" value="a" /> To ensure deterministic plugin resolution and avoid ambiguity</label>
        <label><input type="radio" name="morpheus-q2" value="b" /> Because filesystem plugins cannot define hooks</label>
        <label><input type="radio" name="morpheus-q2" value="c" /> Because entry points are faster</label>
      </div>
      <div class="task-row">
        <label>What is a hook in rag2f?</label>
        <label><input type="radio" name="morpheus-q3" value="a" /> An extension point allowing plugins to modify behavior without changing core</label>
        <label><input type="radio" name="morpheus-q3" value="b" /> A database trigger</label>
        <label><input type="radio" name="morpheus-q3" value="c" /> A mandatory pipeline step</label>
      </div>
      <div class="task-actions">
        <button class="btn" data-action="morpheus-submit">Activate Morpheus</button>
      </div>
    `;
  }

  if (id === "johnny5") {
    panelTask.innerHTML = `
      <p class="task-title">Johnny5 hook routing</p>
      <div class="task-row">
        <label>What is Johnny5 responsible for?</label>
        <label><input type="radio" name="johnny5-q1" value="a" /> Accepting input and delegating processing through hooks/pipelines</label>
        <label><input type="radio" name="johnny5-q1" value="b" /> Registering embedders</label>
        <label><input type="radio" name="johnny5-q1" value="c" /> Selecting repositories</label>
      </div>
      <div class="task-row">
        <label>Why does Johnny5 rely on hooks?</label>
        <label><input type="radio" name="johnny5-q2" value="a" /> To allow different apps to define how input is handled without changing core</label>
        <label><input type="radio" name="johnny5-q2" value="b" /> To encrypt inputs</label>
        <label><input type="radio" name="johnny5-q2" value="c" /> To enforce a single input format</label>
      </div>
      <div class="task-row">
        <label>Why use a track ID for input?</label>
        <label><input type="radio" name="johnny5-q3" value="a" /> To enable traceability, idempotency, and duplicate detection</label>
        <label><input type="radio" name="johnny5-q3" value="b" /> To select the embedder</label>
        <label><input type="radio" name="johnny5-q3" value="c" /> To compress payloads</label>
      </div>
      <div class="task-actions">
        <button class="btn" data-action="johnny5-submit">Activate Johnny5</button>
      </div>
    `;
  }

  if (id === "optimus") {
    panelTask.innerHTML = `
      <p class="task-title">OptimusPrime registry policy</p>
      <div class="task-row">
        <label>What does OptimusPrime manage?</label>
        <label><input type="radio" name="optimus-q1" value="a" /> A registry of embedders keyed by name or ID</label>
        <label><input type="radio" name="optimus-q1" value="b" /> Repositories</label>
        <label><input type="radio" name="optimus-q1" value="c" /> Prompt templates</label>
      </div>
      <div class="task-row">
        <label>Why use an embedder registry?</label>
        <label><input type="radio" name="optimus-q2" value="a" /> To decouple embedder selection from implementation/vendor</label>
        <label><input type="radio" name="optimus-q2" value="b" /> To force a single embedding model</label>
        <label><input type="radio" name="optimus-q2" value="c" /> To improve embedding determinism</label>
      </div>
      <div class="task-row">
        <label>What does “default embedder” mean?</label>
        <label><input type="radio" name="optimus-q3" value="a" /> The configured preferred embedder (or the only registered one)</label>
        <label><input type="radio" name="optimus-q3" value="b" /> The newest embedder</label>
        <label><input type="radio" name="optimus-q3" value="c" /> Always OpenAI</label>
      </div>
      <div class="task-actions">
        <button class="btn" data-action="optimus-submit">Activate OptimusPrime</button>
      </div>
    `;
  }

  if (id === "xfiles") {
    panelTask.innerHTML = `
      <p class="task-title">Register a repository</p>
      <div class="task-row">
        <label>What does XFiles manage?</label>
        <label><input type="radio" name="xfiles-q1" value="a" /> Discovery and lookup of repositories and their capabilities</label>
        <label><input type="radio" name="xfiles-q1" value="b" /> Only filesystem storage</label>
        <label><input type="radio" name="xfiles-q1" value="c" /> Prompt caching</label>
      </div>
      <div class="task-row">
        <label>What are repository “capabilities”?</label>
        <label><input type="radio" name="xfiles-q2" value="a" /> Declared supported operations (vector search, graph traversal, etc.)</label>
        <label><input type="radio" name="xfiles-q2" value="b" /> Maximum storage size</label>
        <label><input type="radio" name="xfiles-q2" value="c" /> Embedding dimension</label>
      </div>
      <div class="task-row">
        <label>Why keep repositories in plugins instead of core?</label>
        <label><input type="radio" name="xfiles-q3" value="a" /> Storage backends change fast; plugins keep core stable and minimal</label>
        <label><input type="radio" name="xfiles-q3" value="b" /> Core cannot import DB drivers</label>
        <label><input type="radio" name="xfiles-q3" value="c" /> Hooks require plugins</label>
      </div>
      <div class="task-actions">
        <button class="btn" data-action="xfiles-submit">Activate XFiles</button>
      </div>
    `;
  }
}

function completeNode(id) {
  state.completed[id] = true;
  const learning = {
    spock: "✅ What you learned:\nSpock centralizes configuration.\nPlugins get isolated settings.\nEach RAG2F instance is independent.",
    morpheus: "✅ What you learned:\nMorpheus discovers and loads plugins.\nHooks let plugins extend behavior.\nResolution stays deterministic.",
    johnny5: "✅ What you learned:\nJohnny5 accepts input and routes it.\nHooks define app-specific handling.\nTrack IDs enable traceability.",
    optimus: "✅ What you learned:\nOptimusPrime catalogs embedders.\nSelection stays vendor-agnostic.\nDefaults come from configuration.",
    xfiles: "✅ What you learned:\nXFiles tracks repositories and capabilities.\nPlugins keep storage flexible.\nCore stays stable as backends evolve.",
  };
  setStatus(learning[id], "success");
  setNodeState();
  renderTask(id);
  if (id === "xfiles") {
    onWin();
  }
}

function onWin() {
  const stepsUsed = INITIAL_STEPS - state.stepsRemaining;
  const best = localStorage.getItem("rag2f_best_steps");
  if (!best || stepsUsed < Number(best)) {
    localStorage.setItem("rag2f_best_steps", String(stepsUsed));
  }
  updateBestScore();
  setStatus("RAG pipeline ONLINE. Boot sequence complete.", "success");
  summaryEl.innerHTML = `
    <span class="badge">Mission recap</span>
    <ul>
      <li>Spock loads {"rag2f": {}, "plugins": {}} and honors RAG2F__ env overrides.</li>
      <li>Morpheus discovers entry points (rag2f.plugins) and filesystem plugins.</li>
      <li>Johnny5 routes text via get_id_input_text → check_duplicated_input_text → handle_text_foreground.</li>
      <li>OptimusPrime blocks unsafe overrides but allows idempotent re-registers.</li>
      <li>XFiles stores repository IDs with metadata. The truth is out there.</li>
    </ul>
  `;
}

function validateSpock() {
  const q1 = document.querySelector("input[name='spock-q1']:checked");
  const q2 = document.querySelector("input[name='spock-q2']:checked");
  const q3 = document.querySelector("input[name='spock-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "a" && q2.value === "a" && q3.value === "a";
}

function validateMorpheus() {
  const q1 = document.querySelector("input[name='morpheus-q1']:checked");
  const q2 = document.querySelector("input[name='morpheus-q2']:checked");
  const q3 = document.querySelector("input[name='morpheus-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "a" && q2.value === "a" && q3.value === "a";
}

function validateJohnny5() {
  const q1 = document.querySelector("input[name='johnny5-q1']:checked");
  const q2 = document.querySelector("input[name='johnny5-q2']:checked");
  const q3 = document.querySelector("input[name='johnny5-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "a" && q2.value === "a" && q3.value === "a";
}

function validateOptimus() {
  const q1 = document.querySelector("input[name='optimus-q1']:checked");
  const q2 = document.querySelector("input[name='optimus-q2']:checked");
  const q3 = document.querySelector("input[name='optimus-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "a" && q2.value === "a" && q3.value === "a";
}

function validateXFiles() {
  const q1 = document.querySelector("input[name='xfiles-q1']:checked");
  const q2 = document.querySelector("input[name='xfiles-q2']:checked");
  const q3 = document.querySelector("input[name='xfiles-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "a" && q2.value === "a" && q3.value === "a";
}

function handleSubmit(action) {
  if (state.stepsRemaining <= 0) return;
  useStep();
  let success = false;

  if (action === "spock-submit") {
    success = validateSpock();
    success ? completeNode("spock") : setStatus("Try again: focus on what this module is responsible for.", "danger");
  }

  if (action === "morpheus-submit") {
    success = validateMorpheus();
    success ? completeNode("morpheus") : setStatus("Try again: focus on what this module is responsible for.", "danger");
  }

  if (action === "johnny5-submit") {
    success = validateJohnny5();
    success ? completeNode("johnny5") : setStatus("Try again: focus on what this module is responsible for.", "danger");
  }

  if (action === "optimus-submit") {
    success = validateOptimus();
    success ? completeNode("optimus") : setStatus("Try again: focus on what this module is responsible for.", "danger");
  }

  if (action === "xfiles-submit") {
    success = validateXFiles();
    success ? completeNode("xfiles") : setStatus("Try again: focus on what this module is responsible for.", "danger");
  }
}

function resetGame() {
  state.stepsRemaining = INITIAL_STEPS;
  state.completed = { spock: false, morpheus: false, johnny5: false, optimus: false, xfiles: false };
  state.selectedNode = null;
  summaryEl.innerHTML = "";
  setStatus("Boot status: awaiting activation.");
  updateSteps();
  setNodeState();
  panelTitle.textContent = "Select a node";
  panelDesc.textContent = "Choose a module to see facts, code excerpts, and the activation puzzle.";
  panelPath.textContent = "--";
  panelSnippet.textContent = "// snippet appears here";
  panelTask.innerHTML = "";
}

function quickTour() {
  if (state.tourRunning) return;
  state.tourRunning = true;
  const order = ["spock", "morpheus", "johnny5", "optimus", "xfiles"];
  order.forEach((id, index) => {
    setTimeout(() => {
      selectNode(id);
      setStatus(`Tour: ${nodes[id].title} — ${nodes[id].role}`);
      if (index === order.length - 1) {
        state.tourRunning = false;
        setStatus("Tour complete. Pick a node to start the boot sequence.");
      }
    }, 900 * index);
  });
}

nodeEls.forEach((node) => {
  node.addEventListener("click", () => selectNode(node.dataset.node));
  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(node.dataset.node);
    }
  });
});

panelTask.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  if (action) {
    handleSubmit(action);
  }
});

resetBtn.addEventListener("click", resetGame);
tourBtn.addEventListener("click", quickTour);

updateSteps();
updateBestScore();
setNodeState();
