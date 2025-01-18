import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from 'markdown-to-jsx'

const Project = () => {
  const location = useLocation();
  console.log(location.state);

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([]);
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = React.createRef();

  function addCollaborator() {
    axios
      .put("/projects/add-user", {
        projectId: project._id,
        users: selectedUserId,
      })
      .then((res) => {
        setProject(res.data.project);
        setSelectedUserId([]);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const handleUserSelect = (userId) => {
    setSelectedUserId((prevState) => {
      const isSelected = prevState.includes(userId);
      if (isSelected) {
        return prevState.filter((id) => id !== userId);
      } else {
        return [...prevState, userId];
      }
    });
  };

  const sendMessageHandler = () => {
    sendMessage("projectMessage", {
      message,
      sender: user,
    });

    appendOutgoingMessage({
      message,
      sender: user,
    });
    setMessage("");
  };

  useEffect(() => {
    // Add CSS to hide scrollbar
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .message-box {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .message-box > div:last-child {
        margin-bottom: 0.5rem;
      }
    `;
    document.head.appendChild(style);

    initializeSocket(project._id);

    receiveMessage("projectMessage", (data) => {
      console.log(data);
      appendIncomingMessage(data);
    });

    axios
      .get(`/projects/get-project/${project._id}`)
      .then((res) => {
        console.log(res.data.project);
        setProject(res.data.project);
      })
      .catch((err) => {
        console.log(err);
      });

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [project._id]);

  function appendIncomingMessage(messageObject) {
    const messageBox = document.querySelector(".message-box");

    const messageElement = document.createElement("div");
    messageElement.classList.add(
      "receiving-message",
      "message",
      "flex",
      "flex-col",
      "p-2",
      "bg-slate-50",
      "max-w-[70%]",
      "rounded-md",
      "break-words"
    );

    if (messageObject.sender._id === "ai") {
      const markdown = <Markdown>{messageObject.message}</Markdown>;
      messageElement.innerHTML = `
        <small class="opacity-50 text-xs">${messageObject.sender.email}</small>
        <p class="text-sm whitespace-pre-wrap">${markdown}</p>
        `;
    } else {
      messageElement.innerHTML = `
      <small class="opacity-50 text-xs">${messageObject.sender.email}</small>
      <p class="text-sm whitespace-pre-wrap">${messageObject.message}</p>
      `;
    }

    messageBox.appendChild(messageElement);
    scrollToBottom();
  }

  function appendOutgoingMessage(messageObject) {
    const messageBox = document.querySelector(".message-box");

    const messageElement = document.createElement("div");
    messageElement.classList.add(
      "ml-auto",
      "sending-message",
      "message",
      "flex",
      "flex-col",
      "p-2",
      "bg-slate-50",
      "max-w-[70%]",
      "rounded-md",
      "break-words"
    );
    messageElement.innerHTML = `
    <small class="opacity-50 text-xs">${messageObject.sender.email}</small>
    <p class="text-sm whitespace-pre-wrap">${messageObject.message}</p>
    `;
    messageBox.appendChild(messageElement);
    scrollToBottom();
  }

  function scrollToBottom() {
    const messageBox = document.querySelector(".message-box");
    messageBox.scrollTop = messageBox.scrollHeight;
  }

  return (
    <main className="h-screen w-screen flex">
      <section className="flex flex-col left w-[400px] bg-slate-300 relative h-screen">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute top-0 z-10">
          <button className="flex gap-2" onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-fill mr-1"></i>
            <p>Add Collaborator</p>
          </button>

          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversation-area flex flex-col h-full pt-14 pb-16">
          <div
            ref={messageBox}
            className="message-box flex-grow flex flex-col gap-1 p-1 overflow-y-auto scrollbar-hide"
            style={{
              maxHeight: 'calc(100vh - 8.5rem)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              width: '100%'
            }}
          ></div>
          <div className="inputField w-full flex gap-1 pb-2 absolute bottom-0 px-2 bg-slate-300">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow p-2 px-5 border-none outline-none rounded-xl"
              type="text"
              placeholder="Enter Message"
            />
            <button
              onClick={sendMessageHandler}
              className="px-4 bg-slate-800 rounded-xl "
            >
              <i className="ri-send-plane-fill text-lg text-white"></i>
            </button>
          </div>
        </div>

        <div
          className={`sidePanel w-full h-full bg-slate-50 absolute transition-all top-0 ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col gap-2`}
        >
          <header className="flex justify-between items-center px-4 p-2 bg-slate-200">
            <h1 className="text-lg font-semibold">Collaborators</h1>
            <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}>
              <i className="ri-close-fill"></i>
            </button>
          </header>

          <div className="users flex flex-col p-2">
            {project?.users?.map((user, index) => (
              <div
                key={user._id || index}
                className="user flex gap-2 items-center cursor-pointer hover:bg-slate-200 p-2"
              >
                <div className="aspect-square rounded-full p-4 text-white w-fit h-fit flex items-center justify-center bg-slate-600">
                  <i className="ri-user-fill absolute"></i>
                </div>
                <h1 className="font-semibold text-lg">{user.email}</h1>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div
        className={`modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${
          isModalOpen ? "" : "hidden"
        }`}
      >
        <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUserId.includes(user._id)
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <i className="ri-user-fill text-gray-600"></i>
                    </div>
                    <div>
                      <h1 className="font-semibold">{user.email}</h1>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 left-0 right-0 pt-4 mt-4 bg-white border-t border-gray-200">
              <button
                onClick={() => {
                  if (selectedUserId.length > 0) {
                    setIsModalOpen(false);
                    addCollaborator();
                  }
                }}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  selectedUserId.length > 0
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                disabled={selectedUserId.length === 0}
              >
                Add Collaborator
                {selectedUserId.length > 0 ? ` (${selectedUserId.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Project;
