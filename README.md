# JAWE (Just Another Workflow Engine)

JAWE is a powerful and extensible Workflow Engine designed to manage workflows as Directed Acyclic Graphs (DAGs). It allows for the seamless integration of custom business logic through plugins, making it ideal for building complex workflows efficiently.

⚠️ **Warning**: This project has been created for educational purposes. Feel free to explore and experiment with it, but it is not recommended for production use at this stage. The project is not stable and is not intended to be a production-ready product.

---

![Talk title - Building a Workflow Engine](./docs/nf-header.png?raw=true "Title")

---

## 🚀 Features

- **Flexible Workflow Templates**: Define workflows with steps and transitions.
- **Plugin-Based Architecture**: Extend functionality with custom plugins.
- **Dynamic Inputs/Outputs**: Handle both static and dynamic data flows.
- **Multiple Triggers**: Initiate workflows via HTTP endpoints, cron jobs, or custom triggers.

---

## 🛠️ Getting Started

### Prerequisites

To use JAWE, ensure you have the following installed:

- Node.js (>= 20.x)
- npm (>= 8.x)
- Docker

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-repo/jawe.git
cd jawe
npm install
```

### Running the Project

Start the development server:

```bash
npm run dev
```

This command starts the JAWE engine and makes it ready for workflow execution.

To run the project, you need to have the Docker container with the database already up and running. Alternatively, you can use the following command to start everything together:

```bash
npm run start
```

This command installs the dependencies, starts the Docker containers using `docker-compose`, and runs the development server.

---

## 🧪 Running Tests

To run the unit tests and ensure everything works as expected:

```bash
npm run test
```

---

## 📄 Creating a Plugin

Plugins encapsulate the business logic of a workflow step. To create a new plugin, follow the guide linked below:

[Guide to Creating a Plugin](docs/Create%20a%20plugin.md)

---

## 🤝 Contributing

We welcome contributions to JAWE! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Make your changes and commit them (`git commit -m 'Add feature'`).
4. Push your branch (`git push origin feature-name`).
5. Open a pull request.

Please adhere to the coding standards and include tests for your changes.

---

## 🗂️ Project Structure

- `backend/`: Contains the core engine logic, the plugins and REST APIs to communicate with the frontend.
- `frontend/`: Houses the frontend with the editor
- `docs/`: Documentation files.

---

## 📢 Support

## For questions, issues, or feature requests, please create an issue in the GitHub repository.

## 📜 License

JAWE is licensed under the MIT License. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
