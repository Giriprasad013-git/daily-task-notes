import React, { useEffect, useState, useRef } from "react";
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
  setNotes as setNotesDB,
  toggleTaskDB,
  addSection as addSectionDB,
  deleteSection as deleteSectionDB,
  setUserPreferences,
} from "./src/db/postgres.js";
import { useAppData } from "./src/contexts/AppDataContext.jsx";

type Task = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  section?: string;
};
type Section = { id: string; name: string; color: string; icon: string };

const DailyTaskTracker = () => {
  // Get shared data from context
  const {
    tasks,
    setTasks,
    notes,
    setNotes,
    sections,
    setSections,
    defaultSections,
    theme,
    setTheme,
    isLoading,
  } = useAppData();

  const [newTask, setNewTask] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [completedPage, setCompletedPage] = useState<number>(1);
  const [currentSection, setCurrentSection] = useState<string>("all");
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

  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const COMPLETED_TASKS_PER_PAGE = 5;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
    };
  }, []);

  // Save theme to database whenever it changes
  useEffect(() => {
    if (theme && theme !== 'light') { // Don't save default theme on first load
      setUserPreferences(theme).catch(console.error);
    }
  }, [theme]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const section = currentSection === "all" ? "personal" : currentSection;
    const created = await addTaskDB(newTask.trim(), section);
    setTasks((prev) => [...prev, created]);
    setNewTask("");
  };

  const addSection = async () => {
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

    try {
      const color = colors[sections.length % colors.length];
      const icon = icons[sections.length % icons.length];

      const newSection = await addSectionDB(
        newSectionName.trim(),
        color,
        icon,
        sections.length
      );

      setSections((prev) => [...prev, newSection]);
      setNewSectionName("");
      setShowAddSection(false);
    } catch (error) {
      console.error("Failed to add section:", error);
    }
  };

  const deleteSection = async (sectionId: string) => {
    // Don't delete default sections
    const isDefaultSection = defaultSections.some((s) => s.id === sectionId);
    if (isDefaultSection) return;

    try {
      await deleteSectionDB(sectionId);
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
    } catch (error) {
      console.error("Failed to delete section:", error);
    }
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

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      key={task.id}
      className={`group px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
        task.completed ? "bg-gray-50/50 dark:bg-gray-800/30" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleTask(task.id)}
          className="flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors" />
          )}
        </button>

        {editingId === task.id ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={saveEdit}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              >
                <Save size={14} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  task.completed
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {task.text}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {task.createdAt}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(task.id, task.text)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentDate}
            </p>
            <button
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

          {/* Compact Section Navigation */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sections
              </h2>
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <FolderPlus size={14} />
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setCurrentSection("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentSection === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <BarChart3 size={14} />
                All ({totalCount})
              </button>

              {sections.map((section) => {
                const stats = sectionStats.find((s) => s.id === section.id);
                const isDefaultSection = defaultSections.some((s) => s.id === section.id);
                return (
                  <div key={section.id} className="inline-flex">
                    <button
                      onClick={() => setCurrentSection(section.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        currentSection === section.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      } ${!isDefaultSection && currentSection === section.id ? "rounded-r-none" : ""}`}
                    >
                      <span>{section.icon}</span>
                      {section.name} ({stats?.total || 0})
                    </button>
                    {currentSection === section.id && !isDefaultSection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSection(section.id);
                        }}
                        className="bg-blue-600 text-white px-1.5 py-1.5 rounded-r-md hover:bg-blue-700 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
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

          {/* Compact Stats */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentSection === "all" ? totalCount : filteredTasks.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentSection === "all" ? completedCount : completedTasks.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Done</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentSection === "all" ? totalCount - completedCount : activeTasks.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                </div>
              </div>
            </div>
          </div>

        {/* Sticky Add Task Bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-3 mb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task..."
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
            <button
              onClick={addTask}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-colors text-sm"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tasks Section */}
          <div className="xl:col-span-2 space-y-4">

            {/* Tasks List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                <div>
                  {/* Active Tasks Section */}
                  {activeTasks.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Active ({activeTasks.length})
                        </h3>
                      </div>
                      <div>
                        {activeTasks.map((task) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks Section */}
                  {completedTasks.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 mt-4">
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Completed ({completedTasks.length})
                        </h3>
                      </div>

                      <div>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 xl:sticky xl:top-4">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-yellow-600" />
                  Quick Notes
                </h2>
              </div>
              <div className="p-4">
                <textarea
                  value={notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotes(v);

                    // Clear existing timeout
                    if (notesTimeoutRef.current) {
                      clearTimeout(notesTimeoutRef.current);
                    }

                    // Debounce save - wait 1 second after user stops typing
                    notesTimeoutRef.current = setTimeout(async () => {
                      await setNotesDB(v);
                    }, 1000);
                  }}
                  placeholder="Jot down quick thoughts..."
                  className="w-full h-64 xl:h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Auto-saved
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
