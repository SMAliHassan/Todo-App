'use strict';

const DEFAULT_THEME = 'day';
const DEFAULT_TYPE = 'all';

// Model
class Model {
  constructor() {
    this.getLocalStorage();
    // Resetting the mode
    this.state.type = DEFAULT_TYPE;
  }

  state = {
    allTodos: [],
    completedTodos: [],
    activeTodos: [],
    theme: DEFAULT_THEME,
    type: DEFAULT_TYPE,
  };

  filter() {
    this.state.completedTodos = [];
    this.state.activeTodos = [];
    this.state.allTodos.forEach(todo => {
      if (todo.completed) this.state.completedTodos.unshift(todo);
      if (todo.active) this.state.activeTodos.unshift(todo);
    });
  }

  setLocalStorage() {
    localStorage.setItem('state', JSON.stringify(this.state));
  }

  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('state'));

    if (!data) return;

    this.state = data;
  }
}
// End of Model

class View {
  #main = document.querySelector('.main');
  #form = document.querySelector('.add-new-todo');
  #formInput = document.querySelector('.add-new-todo__input');
  #todoList = document.querySelector('.main__todo-list');
  #btnClear = document.querySelector('.btn--clear');

  constructor() {
    this.#addHandlerActivateClearBtn();
    this.#addHandlerClearBtn();
  }

  renderMain(data) {
    const type = data.type;

    // Clear the list
    this.#todoList.innerHTML = '';

    // Return if no todo
    if (!data.allTodos.length) return;

    let markup;

    // generate markup
    if (type === 'all') markup = this.#generateMarkupTodos(data.allTodos) + this.#generateMarkupControls(data, type);

    if (type === 'completed')
      markup = this.#generateMarkupTodos(data.completedTodos) + this.#generateMarkupControls(data, type);

    if (type === 'active')
      markup = this.#generateMarkupTodos(data.activeTodos) + this.#generateMarkupControls(data, type);

    // insert the markup
    this.#todoList.insertAdjacentHTML('afterbegin', markup);
  }

  #generateMarkupControls(data, activeBtn) {
    return `
    <li class="main__todo-list__controls controls">
      <p class="controls__items-left">
        <span class="controls__items-left__items">${data.activeTodos.length}</span> items left
      </p>
      <div class="controls__btn-container">
        <a class="controls__btn controls__btn-all ${activeBtn === 'all' ? 'controls__btn--active' : ''}">All</a>
        <a class="controls__btn controls__btn-active ${
          activeBtn === 'active' ? 'controls__btn--active' : ''
        }">Active</a>
        <a
          class="
            controls__btn controls__btn-completed ${activeBtn === 'completed' ? 'controls__btn--active' : ''}
          "
          >Completed</a
        >
        </div>
        <a class="controls__btn-clear">Clear Completed</a>
    </li>
    `;
  }

  #generateMarkupTodos(todos) {
    const markup = todos
      .map(todo => {
        const linkRegex = /(https?\:\/\/)?(www\.)?[^\s]+\.[^\s]+/g;

        function replaceLinks(matched) {
          let withProtocol = matched;

          if (!withProtocol.startsWith('http')) {
            withProtocol = 'http://' + matched;
          }

          const newMarkup = `<a
            class="text-link"
            href="${withProtocol}"
            target="_blank"
          >
            ${matched}
          </a>`;

          return newMarkup;
        }

        const todoMarkupWithLinks = todo.text.replace(linkRegex, replaceLinks);

        return `
      <li class="main__todo-item ${todo.completed ? 'main__todo-item--completed' : ''}" data-id="${todo.id} ">
      <button
      class="
        btn--circle
        main__todo-item__btn-todo--completed
        btn-todo--completed ${todo.completed ? 'btn-todo--completed--active' : ''}
      "
    ></button>
        <label class="main__todo-item__text" 
          >${DOMPurify.sanitize(todoMarkupWithLinks, {
            ALLOWED_TAGS: ['a'],
            ALLOWED_ATTR: ['href', 'target', 'class'],
          })}</label
        >
        <i
          class="fas fa-trash main__todo-item__btn-todo--del btn-todo--del"
        ></i>
      </li>
      `;
      })
      .join('');

    return markup;
  }

  #addHandlerClearBtn() {
    this.#btnClear.addEventListener(
      'click',
      function () {
        if (!this.#btnClear.classList.contains('btn--clear--active')) return;

        this.#formInput.value = '';
        this.#btnClear.classList.remove('btn--clear--active');
      }.bind(this)
    );
  }

  #addHandlerActivateClearBtn() {
    this.#formInput.addEventListener(
      'input',
      function () {
        const inputValue = this.#formInput.value.trim();

        if (!inputValue) {
          this.#btnClear.classList.remove('btn--clear--active');
          return;
        }

        this.#btnClear.classList.add('btn--clear--active');
      }.bind(this)
    );
  }

  addHandlerFormSubmit(handler) {
    this.#form.addEventListener(
      'submit',
      function (e) {
        e.preventDefault();

        // Taking the data from the input
        const todoText = this.#formInput.value.trim();

        if (!todoText) return;

        // Clearing and unfocusing the input
        this.#formInput.value = '';
        this.#formInput.blur();

        // Remove the active class from btnClear
        this.#btnClear.classList.remove('btn--clear--active');

        // Calling the handler
        handler(todoText);
      }.bind(this)
    );
  }

  addHandlerDelBtn(handler) {
    this.#main.addEventListener('click', function (e) {
      const btn = e.target;

      if (!btn.classList.contains('btn-todo--del')) return;

      const delTodo = btn.closest('.main__todo-item');
      delTodo.remove();

      // Select the todo element's id
      const delTodoId = delTodo.dataset.id;

      // Calling the handler
      handler(delTodoId);
    });
  }

  addHandlerThemeBtn(handler) {
    const btnContainer = document.querySelector('.main__nav__theme-btns-container');

    btnContainer.addEventListener('click', function (e) {
      if (e.target.classList.contains('main__nav__theme-btn--night')) {
        handler('night');
      }

      if (e.target.classList.contains('main__nav__theme-btn--day')) {
        handler('day');
      }
    });
  }

  updateItemsLeft(state) {
    document.querySelector('.controls__items-left__items').textContent = state.activeTodos.length;
  }

  addHandlerControlsBtns(filterHandler, clearCompletedHandler) {
    this.#main.addEventListener('click', function (e) {
      const btn = e.target;

      if (btn.classList.contains('controls__btn-all')) filterHandler('all');

      if (btn.classList.contains('controls__btn-active')) filterHandler('active');

      if (btn.classList.contains('controls__btn-completed')) filterHandler('completed');

      if (btn.classList.contains('controls__btn-clear')) clearCompletedHandler();
    });
  }

  addHandlerCompletedBtn(handler) {
    this.#main.addEventListener('click', function (e) {
      const btn = e.target;

      if (!btn.classList.contains('btn-todo--completed')) return;

      // Adding the completed classes
      btn.classList.toggle('btn-todo--completed--active');
      const todoEl = btn.closest('.main__todo-item');
      todoEl.classList.toggle('main__todo-item--completed');

      // Getting the id of the todo
      const todoId = todoEl.dataset.id;

      // Call the handler
      handler(todoId);
    });
  }

  toggleTheme(theme = 'day') {
    // Variables
    const primaryDarkColor = '#25273c';
    const secondaryDarkColor = '#161722';
    const primaryLightColor = '#fff';
    const secondaryLightColor = '#f7e6ff';
    const textLightColor = '#fff';

    const root = document.querySelector(':root');
    const prevTheme = theme === 'day' ? 'night' : 'day';
    const headerHero = document.querySelector('.header__hero');

    //  Toggling the hero imgs
    headerHero.style.backgroundImage = `url('./imgs/${theme}.jpg')`;

    //  Toggling the buttons
    document.querySelector(`.main__nav__theme-btn--${prevTheme}`).classList.remove('hidden');
    document.querySelector(`.main__nav__theme-btn--${theme}`).classList.add('hidden');

    // Changing the colors
    root.style.setProperty('--color-background-primary', theme === 'day' ? primaryLightColor : primaryDarkColor);
    root.style.setProperty('--color-background-secondary', theme === 'day' ? secondaryLightColor : secondaryDarkColor);
    root.style.setProperty('--color-text--dark', theme === 'day' ? primaryDarkColor : textLightColor);
  }
}

class Controller {
  constructor() {
    view.addHandlerThemeBtn(this.controlTheme);
    view.addHandlerFormSubmit(this.controlAddTodo);
    view.addHandlerDelBtn(this.controlTodoDelete);
    view.addHandlerCompletedBtn(this.controlToggleCompleted);
    view.addHandlerControlsBtns(this.controlToggleFilter, this.controlClearCompleted);
    view.toggleTheme(model.state.theme);
    view.renderMain(model.state);
  }

  controlTheme(theme) {
    // Toggle the theme from view
    view.toggleTheme(theme);

    // Persist the theme in model state object and local storage
    model.state.theme = theme;
    model.setLocalStorage();
  }

  controlTodoDelete(id) {
    const delTodoIndex = model.state.allTodos.findIndex(todo => +todo.id === +id);

    // Remove the todo from the allTodos
    model.state.allTodos.splice(delTodoIndex, 1);

    // Re filtering the todo arrays
    model.filter();

    // Persist the state in local storage
    model.setLocalStorage();

    // Re render the todos
    view.renderMain(model.state);
  }

  controlToggleCompleted(id) {
    // Find the todoIndex and the todo in the allTodos
    const todoIndex = model.state.allTodos.findIndex(todo => +todo.id === +id);
    const todo = model.state.allTodos[todoIndex];

    // Toggle the completed and active properties on the todo Obj
    todo.completed = !todo.completed;
    todo.active = !todo.active;

    // Filter the arrays
    model.filter();

    // Re render the todos
    view.renderMain(model.state);

    // Set the local storage
    model.setLocalStorage();
  }

  controlToggleFilter(filter) {
    model.state.type = filter;

    view.renderMain(model.state);

    // // Un-comment this if you want to persist the type when reload
    // model.setLocalStorage();
  }

  controlClearCompleted() {
    // Create a new array to store the active todos
    const newAllTodos = [];

    // Add the todo to newAllTodos if it is active
    for (let i = 0; i < model.state.allTodos.length; i++) {
      const todo = model.state.allTodos[i];

      if (!todo.completed) newAllTodos.unshift(todo);
    }

    // Clear the completed todos
    model.state.completedTodos = [];

    // Setting the allTodos to newAllTodos because it only contains the active todos
    model.state.allTodos = newAllTodos;

    // Persist the localStorage
    model.setLocalStorage();

    // Re render the todos
    view.renderMain(model.state);
  }

  controlAddTodo(todoText) {
    // Create the todo object
    const newTodoObj = {
      text: todoText,
      active: true,
      completed: false,
      id: String(new Date().getTime()).slice(-6),
    };

    // Add the todo object to the state.allTodos and local storage
    model.state.allTodos.unshift(newTodoObj);

    // Re filtering the todo arrays
    model.filter();

    // Persist the state in the local storage
    model.setLocalStorage();

    // Render todo in the main todo list
    view.renderMain(model.state);
  }
}

const model = new Model();
const view = new View();
const controller = new Controller();
