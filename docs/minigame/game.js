const INITIAL_STEPS = 12;

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
        <label>Default config shape:</label>
        <label><input type="radio" name="spock-shape" value="a" /> {"rag2f": {}, "plugins": {}}</label>
        <label><input type="radio" name="spock-shape" value="b" /> {"core": {}, "hooks": {}}</label>
        <label><input type="radio" name="spock-shape" value="c" /> {"rag2f": [], "plugins": []}</label>
      </div>
      <div class="task-row">
        <label>ENV prefix + separator:</label>
        <label><input type="radio" name="spock-env" value="a" /> RAG2F / __</label>
        <label><input type="radio" name="spock-env" value="b" /> RAG2F / --</label>
        <label><input type="radio" name="spock-env" value="c" /> RAG / ::</label>
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
        <label>Plugin discovery model:</label>
        <label><input type="radio" name="morph-discovery" value="a" /> Entry points only</label>
        <label><input type="radio" name="morph-discovery" value="b" /> Filesystem only</label>
        <label><input type="radio" name="morph-discovery" value="c" /> Both; entry points win</label>
      </div>
      <div class="task-row">
        <label>Entry point group name:</label>
        <label><input type="radio" name="morph-group" value="a" /> rag2f.plugins</label>
        <label><input type="radio" name="morph-group" value="b" /> rag2f.extensions</label>
        <label><input type="radio" name="morph-group" value="c" /> rag2f.hooks</label>
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
        <label>Select the hooks used in handle_text_foreground:</label>
        <label><input type="checkbox" name="johnny-hooks" value="get_id_input_text" /> get_id_input_text</label>
        <label><input type="checkbox" name="johnny-hooks" value="check_duplicated_input_text" /> check_duplicated_input_text</label>
        <label><input type="checkbox" name="johnny-hooks" value="handle_text_foreground" /> handle_text_foreground</label>
        <label><input type="checkbox" name="johnny-hooks" value="finalize_output" /> finalize_output</label>
      </div>
      <div class="task-row">
        <label>When no id is returned, Johnny5 uses:</label>
        <label><input type="radio" name="johnny-id" value="a" /> uuid.uuid4().hex</label>
        <label><input type="radio" name="johnny-id" value="b" /> time.time()</label>
        <label><input type="radio" name="johnny-id" value="c" /> incrementing counter</label>
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
        <label>Registering a different instance under the same key:</label>
        <label><input type="radio" name="optimus-override" value="a" /> Allowed</label>
        <label><input type="radio" name="optimus-override" value="b" /> Raises ValueError</label>
        <label><input type="radio" name="optimus-override" value="c" /> Silently replaces</label>
      </div>
      <div class="task-row">
        <label>Registering the exact same instance again:</label>
        <label><input type="radio" name="optimus-idem" value="a" /> Allowed (warn + skip)</label>
        <label><input type="radio" name="optimus-idem" value="b" /> Raises TypeError</label>
        <label><input type="radio" name="optimus-idem" value="c" /> Re-registers with no log</label>
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
        <label>Repository id</label>
        <input type="text" name="xfiles-id" placeholder="users_db" />
      </div>
      <div class="task-row">
        <label>Meta: type</label>
        <input type="text" name="xfiles-type" placeholder="postgresql" />
      </div>
      <div class="task-row">
        <label>Meta: domain</label>
        <input type="text" name="xfiles-domain" placeholder="users" />
      </div>
      <div class="task-actions">
        <button class="btn" data-action="xfiles-submit">Activate XFiles</button>
      </div>
    `;
  }
}

function completeNode(id) {
  state.completed[id] = true;
  setStatus(`${nodes[id].title} is online.`, "success");
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
  const shape = document.querySelector("input[name='spock-shape']:checked");
  const env = document.querySelector("input[name='spock-env']:checked");
  if (!shape || !env) return false;
  return shape.value === "a" && env.value === "a";
}

function validateMorpheus() {
  const discovery = document.querySelector("input[name='morph-discovery']:checked");
  const group = document.querySelector("input[name='morph-group']:checked");
  if (!discovery || !group) return false;
  return discovery.value === "c" && group.value === "a";
}

function validateJohnny5() {
  const hooks = Array.from(document.querySelectorAll("input[name='johnny-hooks']:checked"))
    .map((el) => el.value)
    .sort();
  const idRule = document.querySelector("input[name='johnny-id']:checked");
  if (!hooks.length || !idRule) return false;
  const expected = ["check_duplicated_input_text", "get_id_input_text", "handle_text_foreground"].sort();
  const hooksMatch = hooks.length === expected.length && hooks.every((h, i) => h === expected[i]);
  return hooksMatch && idRule.value === "a";
}

function validateOptimus() {
  const override = document.querySelector("input[name='optimus-override']:checked");
  const idem = document.querySelector("input[name='optimus-idem']:checked");
  if (!override || !idem) return false;
  return override.value === "b" && idem.value === "a";
}

function validateXFiles() {
  const id = document.querySelector("input[name='xfiles-id']").value.trim();
  const type = document.querySelector("input[name='xfiles-type']").value.trim();
  const domain = document.querySelector("input[name='xfiles-domain']").value.trim();
  return Boolean(id && type && domain);
}

function handleSubmit(action) {
  if (state.stepsRemaining <= 0) return;
  useStep();
  let success = false;

  if (action === "spock-submit") {
    success = validateSpock();
    success ? completeNode("spock") : setStatus("Spock quiz failed. Check default shape and ENV pattern.", "danger");
  }

  if (action === "morpheus-submit") {
    success = validateMorpheus();
    success ? completeNode("morpheus") : setStatus("Morpheus expects entry points + filesystem, entry points first.", "danger");
  }

  if (action === "johnny5-submit") {
    success = validateJohnny5();
    success ? completeNode("johnny5") : setStatus("Johnny5 hook routing mismatch. Try again.", "danger");
  }

  if (action === "optimus-submit") {
    success = validateOptimus();
    success ? completeNode("optimus") : setStatus("OptimusPrime blocks overrides but allows same-instance re-registers.", "danger");
  }

  if (action === "xfiles-submit") {
    success = validateXFiles();
    success ? completeNode("xfiles") : setStatus("Fill in repository id + meta before registering.", "danger");
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
