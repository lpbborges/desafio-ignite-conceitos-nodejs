const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checksExistsTodo(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const todoExists = user.todos.some(todo => todo.id === id);

  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found" });
  }

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userExistsWithThatUsername = users.some(user => user.username === username);

  if (userExistsWithThatUsername) {
    return response.status(400).json({ error: "Username already used" });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  }

  users.push(newUser);

  return response.status(201).json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;
  const { user } = request;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);

  if (title)
    user.todos[todoIndex].title = title;
  if (deadline)
    user.todos[todoIndex].deadline = new Date(deadline);

  return response.status(200).json(user.todos[todoIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);

  user.todos[todoIndex].done = true;

  return response.status(200).json(user.todos[todoIndex]);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const updatedTodos = user.todos.filter(todo => todo.id !== id);

  user.todos = updatedTodos;

  return response.status(204).json(updatedTodos);
});

module.exports = app;