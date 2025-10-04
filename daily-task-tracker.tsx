import React, { useEffect, useState } from "react";
import {
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  Edit3,
  Save,
  X,
  StickyNote,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Folder,
  Settings,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  addTaskDB,
  deleteTaskDB,
  editTaskDB,
  updateTaskSectionDB,
  getNotes as getNotesDB,
  listTasks,
  setNotes as setNotesDB,
  toggleTaskDB,
} from "./src/db/postgres.js";

type Task = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  section?: string;
};
type Section = { id: string; name: string; color: string; icon: string };

const DailyTaskTracker = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [newTask, setNewTask] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "light" | "dark") || "light";
  });
  const [completedPage, setCompletedPage] = useState<number>(1);
  const [currentSection, setCurrentSection] = useState<string>("all");
  const defaultSections: Section[] = [
    { id: "work", name: "Work", color: "blue", icon: "💼" },
    { id: "personal", name: "Personal", color: "green", icon: "🏠" },
    { id: "urgent", name: "Urgent", color: "red", icon: "🚨" },
    { id: "ideas", name: "Ideas", color: "purple", icon: "💡" },
  ];
  const [sections, setSections] = useState<Section[]>(() => {
    const savedSections = localStorage.getItem("task-sections");
    if (savedSections) {
      try {
        const parsedSections = JSON.parse(savedSections);
        if (Array.isArray(parsedSections) && parsedSections.length > 0) {
          // Merge: keep default sections + add any new custom ones
          const customSections = parsedSections.filter(
            (s) => !defaultSections.find((d) => d.id === s.id)
          );
          return [...defaultSections, ...customSections];
        }
      } catch (e) {
        console.error("Failed to parse saved sections:", e);
      }
    }
    return defaultSections;
  });
  const [newSectionName, setNewSectionName] = useState<string>("");
  const [showAddSection, setShowAddSection] = useState<boolean>(false);
  const [currentDate] = useState(
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  const COMPLETED_TASKS_PER_PAGE = 5;

  // Load from database on mount
  useEffect(() => {
    (async () => {
      try {
        const [t, n] = await Promise.all([listTasks(), getNotesDB()]);
        setTasks(t);
        setNotes(n || "");
      } catch (e) {
        console.error("Failed to load data", e);
      }
    })();
  }, []);

  // Save sections to localStorage whenever sections change
  useEffect(() => {
    localStorage.setItem("task-sections", JSON.stringify(sections));
  }, [sections]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const section = currentSection === "all" ? "personal" : currentSection;
    const created = await addTaskDB(newTask.trim(), section);
    setTasks((prev) => [...prev, created]);
    setNewTask("");
  };

  const addSection = () => {
    if (!newSectionName.trim()) return;
    const colors = [
      "blue",
      "green",
      "red",
      "purple",
      "yellow",
      "pink",
      "indigo",
      "orange",
    ];
    const icons = ["📁", "🎯", "⭐", "🔥", "📋", "🎨", "🔧", "📊"];

    const newSection: Section = {
      id: newSectionName.toLowerCase().replace(/\s+/g, "-"),
      name: newSectionName.trim(),
      color: colors[sections.length % colors.length],
      icon: icons[sections.length % icons.length],
    };

    setSections((prev) => [...prev, newSection]);
    setNewSectionName("");
    setShowAddSection(false);
  };

  const deleteSection = async (sectionId: string) => {
    if (sections.length <= 1) return; // Keep at least one section
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (currentSection === sectionId) {
      setCurrentSection("all");
    }
    // Update tasks in this section to move to personal section
    const tasksToUpdate = tasks.filter((task) => task.section === sectionId);
    for (const task of tasksToUpdate) {
      await updateTaskSectionDB(task.id, "personal");
    }
    // Update local state
    setTasks((prev) =>
      prev.map((task) =>
        task.section === sectionId ? { ...task, section: "personal" } : task
      )
    );
  };

  const toggleTask = async (id) => {
    const next = await toggleTaskDB(id);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: next } : t))
    );
  };

  const deleteTask = async (id) => {
    await deleteTaskDB(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const startEdit = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = async () => {
    if (!editText.trim()) return cancelEdit();
    await editTaskDB(editingId, editText.trim());
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingId ? { ...t, text: editText.trim() } : t
      )
    );
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  // Filter tasks by section
  const filteredTasks =
    currentSection === "all"
      ? tasks
      : tasks.filter((task) => task.section === currentSection);

  // Separate active and completed tasks from filtered tasks
  const activeTasks = filteredTasks
    .filter((t) => !t.completed)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  const completedTasks = filteredTasks
    .filter((t) => t.completed)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Get current section info
  const currentSectionInfo = sections.find((s) => s.id === currentSection);
  const sectionStats = sections.map((section) => {
    const sectionTasks = tasks.filter((task) => task.section === section.id);
    return {
      ...section,
      total: sectionTasks.length,
      completed: sectionTasks.filter((t) => t.completed).length,
      active: sectionTasks.filter((t) => !t.completed).length,
    };
  });

  // Pagination for completed tasks
  const totalCompletedPages = Math.ceil(
    completedTasks.length / COMPLETED_TASKS_PER_PAGE
  );
  const paginatedCompletedTasks = completedTasks.slice(
    (completedPage - 1) * COMPLETED_TASKS_PER_PAGE,
    completedPage * COMPLETED_TASKS_PER_PAGE
  );

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700",
      green:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700",
      red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700",
      purple:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700",
      yellow:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700",
      pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-700",
      indigo:
        "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700",
      orange:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700",
    };
    return colors[color] || colors.blue;
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      key={task.id}
      className={`group p-4 rounded-xl border-2 transition-all hover:shadow-sm ${
        task.completed
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50"
          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => toggleTask(task.id)}
          className="flex-shrink-0 mt-1"
        >
          {task.completed ? (
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="w-6 h-6 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors" />
          )}
        </button>

        {editingId === task.id ? (
          <div className="flex-1 flex items-center gap-3">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              >
                <Save size={16} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p
                className={`text-lg leading-relaxed ${
                  task.completed
                    ? "line-through text-slate-500 dark:text-slate-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {task.text}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Added at {task.createdAt}
              </p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(task.id, task.text)}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              {/* <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {currentSection === "all"
                  ? "All Tasks"
                  : currentSectionInfo?.name || "Tasks"}
                {currentSection !== "all" && currentSectionInfo && (
                  <span className="ml-3 text-2xl">
                    {currentSectionInfo.icon}
                  </span>
                )}
              </h1> */}
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                {currentDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setTheme((t) => (t === "light" ? "dark" : "light"))
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <Folder className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Sections
              </h2>
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <FolderPlus size={16} />
                Add Section
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setCurrentSection("all")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  currentSection === "all"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <BarChart3 size={16} />
                All Tasks ({totalCount})
              </button>

              {sections.map((section) => {
                const stats = sectionStats.find((s) => s.id === section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(section.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                      currentSection === section.id
                        ? getColorClasses(section.color)
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-base">{section.icon}</span>
                    {section.name} ({stats?.total || 0})
                    {currentSection === section.id &&
                      section.id !== "personal" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="ml-1 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <X size={12} />
                        </button>
                      )}
                  </button>
                );
              })}
            </div>

            {showAddSection && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSection()}
                    placeholder="Section name (e.g., 'Projects', 'Learning')"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500 dark:placeholder-slate-400"
                    autoFocus
                  />
                  <button
                    onClick={addSection}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSection(false);
                      setNewSectionName("");
                    }}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Circle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {currentSection === "all"
                      ? totalCount
                      : filteredTasks.length}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Total Tasks
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {currentSection === "all"
                      ? completedCount
                      : completedTasks.length}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Completed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Circle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {currentSection === "all"
                      ? totalCount - completedCount
                      : activeTasks.length}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Remaining
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Tasks Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Add Task Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Add New Task
                </h2>
                {currentSection !== "all" && currentSectionInfo && (
                  <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <span className="text-sm">{currentSectionInfo.icon}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {currentSectionInfo.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder="What needs to be done?"
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500 dark:placeholder-slate-400"
                  />
                  <button
                    onClick={addTask}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add Task</span>
                  </button>
                </div>

                {currentSection === "all" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Add to:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setCurrentSection(section.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${getColorClasses(
                            section.color
                          )}`}
                        >
                          <span>{section.icon}</span>
                          {section.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {currentSection !== "all" && currentSectionInfo ? (
                      <span className="text-2xl">
                        {currentSectionInfo.icon}
                      </span>
                    ) : (
                      <Circle
                        size={32}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    No tasks in{" "}
                    {currentSection === "all"
                      ? "any section"
                      : currentSectionInfo?.name || "this section"}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {currentSection === "all"
                      ? "Add your first task above to get started!"
                      : `Add tasks to the ${
                          currentSectionInfo?.name || "current"
                        } section to see them here.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Tasks Section */}
                  {activeTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                          <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Active Tasks ({activeTasks.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {activeTasks.map((task) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks Section */}
                  {completedTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Completed Tasks ({completedTasks.length})
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {paginatedCompletedTasks.map((task) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>

                      {/* Pagination for Completed Tasks */}
                      {totalCompletedPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Showing{" "}
                            {(completedPage - 1) * COMPLETED_TASKS_PER_PAGE + 1}{" "}
                            to{" "}
                            {Math.min(
                              completedPage * COMPLETED_TASKS_PER_PAGE,
                              completedTasks.length
                            )}{" "}
                            of {completedTasks.length} completed tasks
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setCompletedPage((prev) =>
                                  Math.max(1, prev - 1)
                                )
                              }
                              disabled={completedPage === 1}
                              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                completedPage === 1
                                  ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <ChevronLeft size={16} />
                              Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {[...Array(totalCompletedPages)].map((_, i) => {
                                const pageNum = i + 1;
                                const isActive = pageNum === completedPage;
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setCompletedPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                      isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() =>
                                setCompletedPage((prev) =>
                                  Math.min(totalCompletedPages, prev + 1)
                                )
                              }
                              disabled={completedPage === totalCompletedPages}
                              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                completedPage === totalCompletedPages
                                  ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              Next
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm xl:sticky xl:top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <StickyNote className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Quick Notes
                </h2>
              </div>
              <textarea
                value={notes}
                onChange={async (e) => {
                  const v = e.target.value;
                  setNotes(v);
                  await setNotesDB(v);
                }}
                placeholder="Jot down quick thoughts, meeting notes, or ideas here..."
                className="w-full h-64 xl:h-96 px-4 py-3 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all resize-none placeholder-slate-500 dark:placeholder-slate-400"
              />
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Auto-saved as you type
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Perfect for meeting notes, ideas, or reminders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Stay organized and productive! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyTaskTracker;
