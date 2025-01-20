import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);

  const fetchProjects = () => {
    axios
      .get("/projects/all")
      .then((res) => {
        console.log("Projects fetched successfully:", res.data.projects);
        setProjects(res.data.projects);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  function createProject(e) {
    e.preventDefault();
    setIsModalOpen(false);
    setProjectName("");

    axios
      .post("/projects/create", { name: projectName })
      .then((res) => {
        console.log("Project created successfully:", res.data);
        // After creating a project, fetch all projects again
        fetchProjects();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const navigate = useNavigate();

  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <main className="p-5">
      <div className="projects">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors w-full justify-center hover:shadow-lg hover:font-semibold h-[60px]"
        >
          New Project
          <i className="ri-add-line text-xl ml-2"></i>
        </button>

        <div className="space-y-4 mt-3">
          {projects &&
            projects.map((project) => (
              <div
                onClick={() => {
                  navigate(`/project`, { state: { project } });
                }}
                key={project._id}
                className="project p-4 border font-mono border-slate-300 rounded-md hover:bg-slate-100 transition-colors flex justify-between items-center gap-3 hover:font-semibold h-[50px]"
              >
                <span className="font-medium">{project.name}</span>

                <div className="flex">
                  <i className="ri-user-line"></i>
                  {project.users.length}
                </div>
              </div>
            ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={createProject}>
              <div className="mb-4">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}