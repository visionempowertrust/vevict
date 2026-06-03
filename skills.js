const seedSkills = [
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Number Recognition",
    skillCode: "NR",
    subSkills: "Is able to identify the braille numbers.\nIs able to identify the print numbers (low vision)."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Systematic Counting",
    skillCode: "SC",
    subSkills: "Is able to count systematically, both forward and backward."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Relating Numbers to Quantity",
    skillCode: "NQ",
    subSkills: "Shows one to one correspondence between number and quantity."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Quantity Discrimination",
    skillCode: "QD",
    subSkills: "Is able to compare the numbers (greater or smaller than); Demonstrate the use of comparing numbers."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Different Number Representation",
    skillCode: "DNR",
    subSkills: "Not specified on source page."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Estimation",
    skillCode: "ES",
    subSkills: "Is able to estimate size of a set or an object; Is able to estimate numbers while comparing."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Simple Arithmetic",
    skillCode: "SA",
    subSkills: "Is able to do simple arithmetic calculations; Counts items that can be perceived by ones to find totals; Builds and subtracts numbers using objects or fingers."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Number Patterns",
    skillCode: "NP",
    subSkills: "Observes and extends patterns in sequence of shapes and numbers; Identifies patterns and creates simple patterns."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Data",
    skillCode: "DA",
    subSkills: "Collects, represents and interprets simple data."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Shapes and Spatial Understanding",
    skillCode: "SSU",
    subSkills: "Familiarises with spatial relationships; Sorts, classifies and describes objects; Identifies basic 3-D shapes."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Measurement",
    skillCode: "ME",
    subSkills: "Measuring length; Measuring time."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Positioning and Locating",
    skillCode: "PL",
    subSkills: "Positioning and locating."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Discrete Modelling",
    skillCode: "DM",
    subSkills: "Familiarises with maps like navigation and locations on maps."
  },
  {
    skillCategory: "Quantitative Aptitude",
    skillName: "Money",
    skillCode: "MN",
    subSkills: "Identifies currency notes and coins; Adds and subtracts small amount of money mentally; Converts rupee to paise; Makes rate charts and bills."
  }
];

const seedLevels = [
  ["Number Recognition", "NR", "Level 1", "NR1.1A", "Reads and writes any given number up to 99 and associates a given collection with a number and vice-versa."],
  ["Number Recognition", "NR", "Level 1", "NR1.1B", "Recognises some numerals, such as those associated with age or home address."],
  ["Number Recognition", "NR", "Level 1", "NR1.1C", "Recognises small quantities without counting."],
  ["Number Recognition", "NR", "Level 1", "NR1.1D", "Orders numerals or cards by number."],
  ["Number Recognition", "NR", "Level 2", "NR1.2A", "Reads and writes any given number up to 99."],
  ["Number Recognition", "NR", "Level 2", "NR1.2B", "Matches one numeral with another."],
  ["Number Recognition", "NR", "Level 3", "NR1.3A", "Reads and writes any given number up to 999."],
  ["Systematic Counting", "SC", "Level 1", "SC1.1A", "Devises ways of collecting and counting the given number of objects."],
  ["Systematic Counting", "SC", "Level 1", "SC1.1B", "Involves different ways of counting."],
  ["Systematic Counting", "SC", "Level 1", "SC1.1C", "Recognises that the last number word said in a count answers how many."],
  ["Systematic Counting", "SC", "Level 1", "SC1.1D", "Matches the count up to 10 to objects using one-to-one principle."],
  ["Systematic Counting", "SC", "Level 1", "SC1.1E", "Responds to a request for a different amount by increasing or decreasing a quantity."],
  ["Systematic Counting", "SC", "Level 1", "SC1.1F", "Produces a rote count to at least 12."],
  ["Systematic Counting", "SC", "Level 2", "SC1.2A", "Demonstrates ways of counting groups of objects."],
  ["Systematic Counting", "SC", "Level 2", "SC1.2B", "Counts items in groups of twos, fives and tens."],
  ["Systematic Counting", "SC", "Level 2", "SC1.2C", "Matches number words within the current counting range to quantities."],
  ["Systematic Counting", "SC", "Level 2", "SC1.2F", "Produces a rote count to at least 100."],
  ["Systematic Counting", "SC", "Level 3", "SC1.3A", "Demonstrates strategies to solve puzzles on missing numbers or filling numbers in a grid."],
  ["Relating Numbers to Quantity", "NQ", "Level 1", "NQ1.1A", "Associates a given collection with a number and vice-versa."],
  ["Relating Numbers to Quantity", "NQ", "Level 2", "NQ1.2A", "Associates a given collection arranged in tens and ones with a number and vice-versa."],
  ["Relating Numbers to Quantity", "NQ", "Level 2", "NQ1.2B", "Attempts to show that zero is the number representing absence of some item in a group."],
  ["Relating Numbers to Quantity", "NQ", "Level 3", "NQ1.3A", "Associates a given collection arranged in tens and ones with a number and vice-versa."],
  ["Quantity Discrimination", "QD", "Level 1", "QD1.1A", "Demonstrates strategies of comparing two numbers using matching one-to-one or sequential order."],
  ["Quantity Discrimination", "QD", "Level 1", "QD2.1A", "Compares two quantities up to 10 and states which group has more."],
  ["Quantity Discrimination", "QD", "Level 2", "QD1.2A", "Demonstrates strategies of comparing two numbers using size of number or place value."],
  ["Quantity Discrimination", "QD", "Level 3", "QD1.3A", "Demonstrates strategies of comparing two numbers using sequential order, place value, or digits."],
  ["Different Number Representation", "DNR", "Level 1", "DNR.1A", "Attempts to write any given number up to 99."],
  ["Estimation", "ES", "Level 1", "ES1.1A", "Understands objects and their attributes: shape, size, colour and texture."],
  ["Estimation", "ES", "Level 2", "ES1.2A", "Uses estimation in verification of sums and differences of two-digit numbers."],
  ["Estimation", "ES", "Level 3", "ES1.3A", "Uses estimation in verification of sums and differences of two and three-digit numbers."],
  ["Simple Arithmetic", "SA", "Level 1", "SA1.1A", "Performs simple instructions and mathematical operations in a classroom."],
  ["Simple Arithmetic", "SA", "Level 1", "SA2.1A", "Analyses and describes simple contextual problems in mathematical terms."],
  ["Simple Arithmetic", "SA", "Level 1", "SA3.1A", "Finds strategies to reach unknown from the known."],
  ["Simple Arithmetic", "SA", "Level 2", "SA1.2A", "Devises strategies to add two-digit numbers and later uses algorithms for addition."],
  ["Simple Arithmetic", "SA", "Level 2", "SA2.2A", "Analyses and describes a problem involving addition or subtraction."],
  ["Simple Arithmetic", "SA", "Level 2", "SA3.2A", "Finds repeated addition strategies and appreciates multiplication."],
  ["Simple Arithmetic", "SA", "Level 3", "SA1.3A", "Applies inverse relationship of addition and subtraction."],
  ["Simple Arithmetic", "SA", "Level 3", "SA2.3A", "Applies multiplication facts and repeated addition."],
  ["Simple Arithmetic", "SA", "Level 3", "SA3.3A", "Understands division as sharing equally or grouping."],
  ["Number Patterns", "NP", "Level 1", "NP1.1A", "Identifies and continues patterns in tiles, numbers, and shapes."],
  ["Number Patterns", "NP", "Level 2", "NP2.2A", "Continues patterns where the difference between each term is the same number."],
  ["Number Patterns", "NP", "Level 3", "NP1.3A", "Identifies simple patterns from school activities and supplies missing numbers."],
  ["Data", "DA", "Level 1", "DA1.1A", "Understands objects and their attributes."],
  ["Data", "DA", "Level 2", "DA1.2A", "Classifies objects as per their attribute."],
  ["Data", "DA", "Level 3", "DA1.3A", "Attempts to record information in their own way."],
  ["Shapes and Spatial Understanding", "SSU", "Level 1", "SSU1.1A", "Displays understanding of spatial relationships such as top-bottom, inside-outside and above-below."],
  ["Shapes and Spatial Understanding", "SSU", "Level 1", "SSU2.1A", "Classifies and sorts objects on the basis of common property."],
  ["Shapes and Spatial Understanding", "SSU", "Level 2", "SSU1.2A", "Displays understanding of 3-D shapes around them."],
  ["Shapes and Spatial Understanding", "SSU", "Level 2", "SSU2.2A", "Participates in discussions with others to draw inferences from recorded information."],
  ["Shapes and Spatial Understanding", "SSU", "Level 2", "SSU3.2A", "Shows understanding by naming 2-D shapes and discovering observable properties."],
  ["Shapes and Spatial Understanding", "SSU", "Level 3", "SSU1.3A", "Identifies rectangles, triangles and other rectilinear shapes formed by creases of paper."],
  ["Shapes and Spatial Understanding", "SSU", "Level 3", "SSU2.3A", "Demonstrates shapes like book, glass, bottle and box as 3-D shapes."],
  ["Shapes and Spatial Understanding", "SSU", "Level 3", "SSU3.3A", "Demonstrates ability to differentiate between 2-D and 3-D shapes."],
  ["Measurement", "ME", "Level 1", "ME1.1A", "Identifies the attribute of length using gestures."],
  ["Measurement", "ME", "Level 1", "ME1.1B", "Identifies the longest object using direct comparison."],
  ["Measurement", "ME", "Level 2", "ME1.2A", "Uses everyday language to describe attributes that can be measured."],
  ["Measurement", "ME", "Level 3", "ME1.3A", "Converts between formal units of measurement."],
  ["Positioning and Locating", "PL", "Level 1", "PL.1A", "Locates positions in the classroom relevant to self."],
  ["Positioning and Locating", "PL", "Level 1", "PL.1B", "Orients self to obtain a desired object."],
  ["Positioning and Locating", "PL", "Level 2", "PL.2A", "Interprets a simple diagram or picture to describe position of an object."],
  ["Positioning and Locating", "PL", "Level 3", "PL.3A", "Gives and follows directions from one place to another."],
  ["Discrete Modelling", "DM", "Level 1", "DM1.1A", "Navigates path to reach certain locations and avoid obstacles."],
  ["Discrete Modelling", "DM", "Level 2", "DM1.2A", "Shows understanding of maps by drawing a map of immediate surroundings."],
  ["Discrete Modelling", "DM", "Level 3", "DM1.3A", "Displays understanding of a grid or map."],
  ["Money", "MN", "Level 1", "MN1.1A", "Demonstrates use of numbers in identifying and making play currency notes."],
  ["Money", "MN", "Level 2", "MN2.2A", "Attempts to use small amounts of money by using three or four play notes."],
  ["Money", "MN", "Level 3", "MN1.3A", "Demonstrates use of numbers in identifying and making currency notes."],
  ["Money", "MN", "Level 3", "MN4.3A", "Estimates approximate money required and money obtained in balance in simple buying situations."]
].map(([skillName, skillCode, level, kliCode, indicator]) => ({
  id: makeId(),
  source: "FONS",
  skillName,
  skillCode,
  level,
  kliCode,
  indicator
}));

const storageKey = "vict-skills-v1";
const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let data = loadLocalData();
let activeSkillCode = data.skills[0]?.skillCode || "";

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function loadLocalData() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored?.skills?.length) return stored;
  } catch {
    return { skills: seedSkills, levels: seedLevels };
  }
  return { skills: seedSkills, levels: seedLevels };
}

function saveLocalData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

async function syncFromSupabase() {
  if (!isDbEnabled()) {
    alert("Supabase is not configured with the anon key yet. Run the SQL schema, then update supabase-config.js.");
    return;
  }
  try {
    const remote = await dbStore.loadSkillsData();
    if (remote?.skills?.length) {
      data = remote;
      activeSkillCode = data.skills[0]?.skillCode || "";
      saveLocalData();
      render();
    }
  } catch (error) {
    alert(`Could not load skills from Supabase: ${error.message}`);
  }
}

async function syncToSupabase() {
  if (!isDbEnabled()) {
    alert("Supabase is not configured with the anon key yet. Run the SQL schema, then update supabase-config.js.");
    return;
  }
  try {
    await dbStore.saveSkillsData(data);
    alert("Skills and skill levels saved to Supabase.");
  } catch (error) {
    alert(`Could not save skills to Supabase: ${error.message}`);
  }
}

function render() {
  saveLocalData();
  renderSkills();
}

function renderSkills() {
  $("#skills-table").innerHTML = data.skills.map((skill, index) => `
    <tr class="${skill.skillCode === activeSkillCode ? "active-row" : ""}">
      <td>${escapeHtml(skill.skillCategory)}</td>
      <td>
        <span>${escapeHtml(skill.skillName || "Unnamed skill")}</span>
        <button class="table-button skill-open" type="button" data-skill-code="${escapeAttr(skill.skillCode)}">Show levels</button>
      </td>
      <td>${escapeHtml(skill.skillCode)}</td>
      <td>${escapeHtml(skill.subSkills)}</td>
    </tr>
  `).join("");

  $("#skills-table").querySelectorAll(".skill-open").forEach((button) => {
    button.addEventListener("click", () => {
      openLevels(button.dataset.skillCode);
    });
  });
}

function openLevels(skillCode) {
  activeSkillCode = skillCode;
  const skill = data.skills.find((item) => item.skillCode === activeSkillCode);
  $("#levels-title").textContent = skill ? `${skill.skillName} skill levels` : "Skill levels";
  $("#levels-subtitle").textContent = skill ? `Showing levels for ${skill.skillCode}.` : "";

  const rows = data.levels
    .filter((level) => level.skillCode === activeSkillCode)
    .map((level, index) => ({ level, index: data.levels.indexOf(level) }));

  if (!rows.length) {
    $("#levels-table").innerHTML = '<tr><td colspan="7" class="muted">No levels recorded for this skill yet.</td></tr>';
    return;
  }

  $("#levels-table").innerHTML = rows.map(({ level }) => `
    <tr>
      <td>${escapeHtml(level.source)}</td>
      <td>${escapeHtml(level.skillName)}</td>
      <td>${escapeHtml(level.skillCode)}</td>
      <td>${escapeHtml(level.level)}</td>
      <td>${escapeHtml(level.kliCode)}</td>
      <td>${escapeHtml(level.indicator)}</td>
    </tr>
  `).join("");
  $("#levels-modal").classList.remove("hidden");
}

function closeLevels() {
  $("#levels-modal").classList.add("hidden");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

$("#sync-skills").addEventListener("click", syncToSupabase);
$("#close-levels").addEventListener("click", closeLevels);
$("#levels-modal").addEventListener("click", (event) => {
  if (event.target.id === "levels-modal") closeLevels();
});

render();
if (isDbEnabled()) {
  syncFromSupabase();
}
