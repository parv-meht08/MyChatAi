import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from "markdown-to-jsx";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactDOM from "react-dom";
import { getWebContainer } from "../config/webContainer";

const CodeBlock = ({ children, className }) => {
  const language = className ? className.replace("lang-", "") : "javascript";
  return (
    <div className="rounded-md overflow-hidden my-2">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.875rem",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

const options = {
  overrides: {
    code: {
      component: CodeBlock,
    },
  },
};

const Project = () => {
  const location = useLocation();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([]);
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = React.createRef();
  const [fileTree, setFileTree] = useState(location.state.project?.fileTree || {});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [webContainer, setWebContainer] = useState(null);
  const [pendingFileTree, setPendingFileTree] = useState(null);
  const [iFrameURL, setIFrameURL] = useState(null)
  const [runProcess, setRunProcess] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mountFileTree = async (tree) => {
    if (webContainer && tree) {
      try {
        await webContainer.mount(tree);
      } catch (error) {
        console.error("Failed to mount file tree:", error);
      }
    }
  };

  useEffect(() => {
    if (project.fileTree) {
      setFileTree(project.fileTree);
      setPendingFileTree(project.fileTree);
    }
  }, [project.fileTree]);

  useEffect(() => {
    if (webContainer && pendingFileTree) {
      mountFileTree(pendingFileTree);
    }
  }, [webContainer, pendingFileTree]);

  useEffect(() => {
    const initWebContainer = async () => {
      try {
        const container = await getWebContainer();
        setWebContainer(container);
        console.log("WebContainer initialized successfully");
      } catch (err) {
        console.error("Failed to initialize WebContainer:", err);
        setError("Failed to initialize development environment");
      }
    };

    initWebContainer();
  }, []);

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
        console.error("Failed to add collaborator:", err);
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
    const style = document.createElement("style");
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
      try {
        let message;
        if (typeof data.message === "string") {
          try {
            message = JSON.parse(data.message);
          } catch (parseError) {
            // If parsing fails, treat it as a plain text message
            message = { text: data.message };
          }
        } else {
          message = data.message;
        }

        if (message && message.fileTree) {
          setFileTree(message.fileTree);
          setPendingFileTree(message.fileTree);
        }
        appendIncomingMessage({
          ...data,
          message: message
        });
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    axios
      .get(`/projects/get-project/${project._id}`)
      .then((res) => {
        setProject(res.data.project);
        setFileTree(res.data.project.fileTree || {});
      })
      .catch((err) => {
        console.error("Failed to get project:", err);
      });

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.error("Failed to get users:", err);
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

    if (messageObject.sender._id === "AI") {
      let messageText = messageObject.message;
      if (typeof messageText === 'object') {
        messageText = messageObject.message.text || JSON.stringify(messageText);
      }

      const tempContainer = document.createElement("div");
      const root = ReactDOM.createRoot(tempContainer);
      root.render(
        <div>
          <small className="opacity-50 text-xs">
            {messageObject.sender.email}
          </small>
          <p className="text-sm whitespace-pre-wrap">{messageText}</p>
        </div>
      );
      messageElement.appendChild(tempContainer);
    } else {
      const messageText = typeof messageObject.message === 'object' 
        ? messageObject.message.text || JSON.stringify(messageObject.message)
        : messageObject.message;
        
      messageElement.innerHTML = `
        <small class="opacity-50 text-xs">${messageObject.sender.email}</small>
        <p class="text-sm whitespace-pre-wrap">${messageText}</p>
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

  function saveFileTree(ft) {
    axios.put("/projects/update-file-tree", {
      projectId: project._id,
      fileTree: ft,
    })
    .then((res) => {
      setProject(res.data.project);
      setFileTree(res.data.project.fileTree || {});
    })
    .catch((err) => {
      console.error("Error saving file tree:", err);
    });
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
              maxHeight: "calc(100vh - 8.5rem)",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              width: "100%",
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

      <section className="right bg-red-100 flex-grow h-full flex">
        <div className="explorer h-full min-w-52 max-w-64 bg-slate-400">
          <div className="fileTree w-full">
            {Object.keys(fileTree || {}).map((file) => (
              <button
                key={file}
                onClick={() => {
                  setCurrentFile(file);
                  setOpenFiles(
                    openFiles.includes(file) ? openFiles : [...openFiles, file]
                  );
                }}
                className="tree-element p-2 px-4 flex items-center gap-2 bg-slate-200 w-full cursor-pointer hover:bg-slate-300"
              >
                <p className="font-semibold text-lg">{file}</p>
              </button>
            ))}
          </div>
        </div>

      
          <div className="code-editor flex flex-col h-full flex-grow">
            <div className="top flex gap-1 bg-slate-200 p-1">

              <div className="files flex w-full">
              {
                openFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentFile(file);
                    }}
                    className={`font-semibold text-lg p-2 transition-colors ${
                      currentFile === file
                        ? "bg-slate-600 text-white"
                        : "bg-slate-300 hover:bg-slate-400"
                    }`}
                  >
                    {file}
                  </button>
                ))
              }
              </div>

              <div className="actions flex gap-2">
                <button
                onClick={async() => {
                  await webContainer.mount(fileTree)

                  const installProcess = await 
                  webContainer?.spawn("npm", ["install"]);

                  installProcess?.output.pipeTo(new WritableStream({
                    write(chunk) {
                    }
                  }))  

                  if(runProcess) {
                    runProcess.kill();
                  }

                  let tempRunProcess = await webContainer?.spawn("npm", ["start"]);

                  tempRunProcess?.output.pipeTo(new WritableStream({
                    write(chunk) {
                    }
                  }))

                  setRunProcess(tempRunProcess);

                  webContainer.on('server-ready', (port, url) => {
                    setIFrameURL(url);
                  })
                }}
                className="font-semibold text-lg p-2 transition-colors bg-slate-300 hover:bg-slate-400"
                >run</button>
              </div>
            </div>

            <div className="bottom flex flex-grow h-full">
              {fileTree[currentFile] && fileTree[currentFile].file && (
                <textarea
                value={fileTree[currentFile].file.contents}
                onChange={(e) => {
                  const ft = {
                    ...fileTree,
                    [currentFile]: {
                      ...fileTree[currentFile],
                      file: {
                        ...fileTree[currentFile].file,
                        contents: e.target.value
                      }
                    }
                  };
                  setFileTree(ft);
                  saveFileTree(ft);
                }}
                className="w-full h-full p-4 font-mono text-[15px] bg-slate-800 text-[#d4d4d4] outline-none resize-none"
                style={{
                  lineHeight: "1.5",
                  tabSize: "2",
                }}></textarea>
              )}
            </div>
          </div>

          {iFrameURL && webContainer && (
            <div className="flex min-w-96 flex-col h-full">
              <div className="address-bar">
                <input
                  value={iFrameURL}
                  onChange={(e) => setIFrameURL(e.target.value)}
                  className="w-full p-2 px-5 border-none outline-none"
                  type="text"
                  placeholder="Enter URL"
                />
              </div>
              <iframe
                src={iFrameURL}
                title="Web Container"
                className="w-full h-full"
              />
            </div>
          )}

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