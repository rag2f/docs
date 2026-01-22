const INITIAL_STEPS = 20;

const state = {
  stepsRemaining: INITIAL_STEPS,
  selectedNode: null,
  mistakes: 0,
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
const mistakesEl = document.getElementById("mistakesCount");
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

function shuffleOptions(options) {
  const shuffled = options.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderOptions(name, options) {
  return shuffleOptions(options)
    .map((option) => `<label><input type="radio" name="${name}" value="${option.value}" /> ${option.label}</label>`)
    .join("");
}

function updateMistakes() {
  if (mistakesEl) {
    mistakesEl.textContent = String(state.mistakes);
  }
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
        ${renderOptions("spock-q1", [
          { value: "wrong-1", label: "Run retrieval and ranking stages for answers" },
          { value: "correct", label: "Centralize config by merging env, files, and defaults" },
          { value: "wrong-2", label: "Store embeddings and vectors for search" },
        ])}
      </div>
      <div class="task-row">
        <label>Why does rag2f namespace configuration per plugin?</label>
        ${renderOptions("spock-q2", [
          { value: "wrong-1", label: "To speed up embedding by shortening config lookups" },
          { value: "wrong-2", label: "To force a fixed pipeline for every plugin" },
          { value: "correct", label: "To isolate plugin settings and avoid collisions" },
        ])}
      </div>
      <div class="task-row">
        <label>Why is configuration instance-scoped?</label>
        ${renderOptions("spock-q3", [
          { value: "wrong-1", label: "To prevent plugins from sharing any state" },
          { value: "wrong-2", label: "To keep env vars global across processes" },
          { value: "correct", label: "To allow separate configs per instance (tests, tenants, apps)" },
        ])}
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
        ${renderOptions("morpheus-q1", [
          { value: "wrong-1", label: "Run vector similarity queries over embeddings" },
          { value: "wrong-2", label: "Tokenize text and assemble prompts" },
          { value: "correct", label: "Discover, load, and orchestrate plugins and hooks" },
        ])}
      </div>
      <div class="task-row">
        <label>Why are entry-point plugins resolved before filesystem plugins?</label>
        ${renderOptions("morpheus-q2", [
          { value: "wrong-1", label: "Entry points load faster at runtime" },
          { value: "correct", label: "Deterministic resolution that avoids ambiguous duplicates" },
          { value: "wrong-2", label: "Filesystem plugins cannot define hooks" },
        ])}
      </div>
      <div class="task-row">
        <label>What is a hook in rag2f?</label>
        ${renderOptions("morpheus-q3", [
          { value: "wrong-1", label: "A database trigger that runs on writes" },
          { value: "correct", label: "An extension point where plugins can alter behavior" },
          { value: "wrong-2", label: "A mandatory pipeline step enforced by core" },
        ])}
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
        ${renderOptions("johnny5-q1", [
          { value: "wrong-1", label: "Selecting repositories for storage and search" },
          { value: "correct", label: "Accepting input and routing it through hooks/pipelines" },
          { value: "wrong-2", label: "Registering embedders into OptimusPrime" },
        ])}
      </div>
      <div class="task-row">
        <label>Why does Johnny5 rely on hooks?</label>
        ${renderOptions("johnny5-q2", [
          { value: "wrong-1", label: "To encrypt inputs before storage" },
          { value: "wrong-2", label: "To enforce a single global input format" },
          { value: "correct", label: "To let apps define handling without changing core" },
        ])}
      </div>
      <div class="task-row">
        <label>Why use a track ID for input?</label>
        ${renderOptions("johnny5-q3", [
          { value: "wrong-1", label: "To compress payloads for transport" },
          { value: "correct", label: "To enable traceability, idempotency, and duplicate detection" },
          { value: "wrong-2", label: "To select which embedder to use" },
        ])}
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
        ${renderOptions("optimus-q1", [
          { value: "wrong-1", label: "Curate prompt templates for generation" },
          { value: "correct", label: "Registry of embedders keyed by name or ID" },
          { value: "wrong-2", label: "Store repositories and their metadata" },
        ])}
      </div>
      <div class="task-row">
        <label>Why use an embedder registry?</label>
        ${renderOptions("optimus-q2", [
          { value: "wrong-1", label: "To force a single embedding model everywhere" },
          { value: "wrong-2", label: "To guarantee deterministic vectors across vendors" },
          { value: "correct", label: "To decouple embedder choice from vendor implementation" },
        ])}
      </div>
      <div class="task-row">
        <label>What does “default embedder” mean?</label>
        ${renderOptions("optimus-q3", [
          { value: "wrong-1", label: "The newest embedder in the registry" },
          { value: "correct", label: "The configured preferred embedder (or the only one)" },
          { value: "wrong-2", label: "Always OpenAI regardless of config" },
        ])}
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
        ${renderOptions("xfiles-q1", [
          { value: "wrong-1", label: "Only filesystem storage for documents" },
          { value: "correct", label: "Discover and look up repositories and capabilities" },
          { value: "wrong-2", label: "Cache prompts and responses for reuse" },
        ])}
      </div>
      <div class="task-row">
        <label>What are repository “capabilities”?</label>
        ${renderOptions("xfiles-q2", [
          { value: "wrong-1", label: "Maximum storage size limits for the backend" },
          { value: "wrong-2", label: "Embedding vector dimension for stored data" },
          { value: "correct", label: "Declared supported ops (vector search, graph traversal, etc.)" },
        ])}
      </div>
      <div class="task-row">
        <label>Why keep repositories in plugins instead of core?</label>
        ${renderOptions("xfiles-q3", [
          { value: "wrong-1", label: "Hooks require plugins to exist at all" },
          { value: "correct", label: "Backends change fast; plugins keep core stable" },
          { value: "wrong-2", label: "Core cannot import any database drivers" },
        ])}
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
  return q1.value === "correct" && q2.value === "correct" && q3.value === "correct";
}

function validateMorpheus() {
  const q1 = document.querySelector("input[name='morpheus-q1']:checked");
  const q2 = document.querySelector("input[name='morpheus-q2']:checked");
  const q3 = document.querySelector("input[name='morpheus-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "correct" && q2.value === "correct" && q3.value === "correct";
}

function validateJohnny5() {
  const q1 = document.querySelector("input[name='johnny5-q1']:checked");
  const q2 = document.querySelector("input[name='johnny5-q2']:checked");
  const q3 = document.querySelector("input[name='johnny5-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "correct" && q2.value === "correct" && q3.value === "correct";
}

function validateOptimus() {
  const q1 = document.querySelector("input[name='optimus-q1']:checked");
  const q2 = document.querySelector("input[name='optimus-q2']:checked");
  const q3 = document.querySelector("input[name='optimus-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "correct" && q2.value === "correct" && q3.value === "correct";
}

function validateXFiles() {
  const q1 = document.querySelector("input[name='xfiles-q1']:checked");
  const q2 = document.querySelector("input[name='xfiles-q2']:checked");
  const q3 = document.querySelector("input[name='xfiles-q3']:checked");
  if (!q1 || !q2 || !q3) return false;
  return q1.value === "correct" && q2.value === "correct" && q3.value === "correct";
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

  if (!success) {
    state.mistakes += 1;
    updateMistakes();
    if (state.mistakes >= 5) {
      setStatus("Too many mistakes. Resetting the boot sequence.", "danger");
      resetGame();
    }
  }
}

function resetGame() {
  state.stepsRemaining = INITIAL_STEPS;
  state.mistakes = 0;
  state.completed = { spock: false, morpheus: false, johnny5: false, optimus: false, xfiles: false };
  state.selectedNode = null;
  summaryEl.innerHTML = "";
  setStatus("Boot status: awaiting activation.");
  updateSteps();
  updateMistakes();
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
updateMistakes();
setNodeState();
