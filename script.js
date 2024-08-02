const input = document.querySelector(".todo-input");
const dateInput = document.querySelector("#dateInput");
const timeInput = document.querySelector("#timeInput");
const todosHtml = document.querySelector(".todos");
const emptyImage = document.querySelector(".empty-image");
let todosJson = JSON.parse(localStorage.getItem("todos")) || [];
const deleteAllButton = document.querySelector(".delete-all");
const filters = document.querySelectorAll(".filter");
let filter = '';
let timeoutIds = [];

showTodos();

function getTodoHtml(todo, index) {
  if (filter && filter != todo.status) {
    return '';
  }
  let checked = todo.status == "completed" ? "checked" : "";
  return /* html */ `
    <li class="todo">
      <label for="${index}">
        <input id="${index}" onclick="updateStatus(this)" type="checkbox" ${checked}>
        <span class="${checked}">${todo.name}</span>
      </label>
      <span>${todo.reminder ? `${todo.reminder.date} ${todo.reminder.time}`:''}</span>
      <button class="edit-btn" data-index="${index}" onclick="edit(this)"><i class="fa fa-edit"></i></button>
      <button class="delete-btn" data-index="${index}" onclick="remove(this)"><i class="fa fa-times"></i></button>
    </li>
  `; 
}

function showTodos() {
  if (todosJson.length == 0) {
    todosHtml.innerHTML = '';
    emptyImage.style.display = 'block';
  } else {
    todosHtml.innerHTML = todosJson.map(getTodoHtml).join('');
    emptyImage.style.display = 'none';
  }
}

function addTodoWithReminder() {
  let todo = input.value.trim();
  if (!todo) {
    return;
  }
  let reminder = getReminder();
  addTodo(todo, reminder);
}

function addTodo(todo, reminder = null) {
  input.value = "";
  dateInput.value = "";
  timeInput.value = "";
  todosJson.unshift({ name: todo, status: "pending", reminder: reminder });
  localStorage.setItem("todos", JSON.stringify(todosJson));
  showTodos();
  if (reminder) {
    setReminder(todo, reminder);
  }
}

function getReminder() {
  let dateValue = dateInput.value;
  let timeValue = timeInput.value;
  if (dateValue && timeValue) {
    return { date: dateValue, time: timeValue };
  }
  return null;
}

input.addEventListener("keyup", e => {
  let todo = input.value.trim();
  if (!todo || e.key != "Enter") {
    return;
  }
  let reminder = getReminder();
  addTodoWithReminder();
});

function updateStatus(todo) {
  let todoName = todo.parentElement.lastElementChild;
  if (todo.checked) {
    todoName.classList.add("checked");
    todosJson[todo.id].status = "completed";
    clearReminder(todosJson[todo.id]); // Clear reminder
  } else {
    todoName.classList.remove("checked");
    todosJson[todo.id].status = "pending";
    // Optionally, you can set the reminder again here if needed
  }
  localStorage.setItem("todos", JSON.stringify(todosJson));
}

function remove(todo) {
  const index = todo.dataset.index;
  todosJson.splice(index, 1);
  showTodos();
  localStorage.setItem("todos", JSON.stringify(todosJson));
}

function edit(todo) {
  const index = todo.dataset.index;
  const newTodo = prompt("Edit task:", todosJson[index].name);
  if (newTodo !== null && newTodo.trim() !== "") {
    todosJson[index].name = newTodo.trim();
    const newReminderDate = prompt("Edit date (YYYY-MM-DD):", todosJson[index].reminder ? todosJson[index].reminder.date : "");
    const newReminderTime = prompt("Edit time (HH:MM):", todosJson[index].reminder ? todosJson[index].reminder.time : "");
    if (newReminderDate && newReminderTime) {
      todosJson[index].reminder = { date: newReminderDate, time: newReminderTime };
      setReminder(todosJson[index].name, todosJson[index].reminder);
    } else {
      todosJson[index].reminder = null;
    }
    localStorage.setItem("todos", JSON.stringify(todosJson));
    showTodos();
  }
}

filters.forEach(function (el) {
  el.addEventListener("click", (e) => {
    if (el.classList.contains('active')) {
      el.classList.remove('active');
      filter = '';
    } else {
      filters.forEach(tag => tag.classList.remove('active'));
      el.classList.add('active');
      filter = e.target.dataset.filter;
    }
    showTodos();
  });
});

deleteAllButton.addEventListener("click", () => {
  todosJson = [];
  localStorage.setItem("todos", JSON.stringify(todosJson));
  showTodos();
});

// Request Notification Permission
if (Notification.permission !== "granted") {
  requestNotificationPermission();
}

function requestNotificationPermission() {
  Notification.requestPermission().then(permission => {
    if (permission === "denied") {
      alert("Without allowing notifications, you won't receive task reminders when you set a reminder.");
      // Re-request permission immediately after the alert
      alertUserToReRequestPermission();
    }
  });
}

function alertUserToReRequestPermission() {
  // Set a timeout to ensure the alert box is closed before requesting permission again
  setTimeout(() => {
    Notification.requestPermission().then(newPermission => {
      if (newPermission === "granted") {
        alert("Thank you for allowing notifications!");
      }
    });
  }, 100); // Short delay
}

function showNotification(todo) {
  if (Notification.permission === "granted") {
    const notification = new Notification("Reminder", {
      body: `Time to: ${todo}`,
      icon: "Images/bell-ring-solid-24.png" // Optional: add an icon for the notification
    });

    // Play sound when notification is shown
    notification.onshow = function() {
      document.getElementById('notificationSound').play();
    };

    // Optional: handle notification click
    notification.onclick = function() {
      window.focus(); // Focus the window when clicked
    };
  } else {
    alert(`Reminder: ${todo}`);
    document.getElementById('notificationSound').play();
  }
}

todosJson.forEach(todo => {
  if (todo.reminder) {
    setReminder(todo.name, todo.reminder);
  }
});

function scheduleReminder(){
    let todo = input.value.trim();
    let dateValue = dateInput.value;
    let timeValue = timeInput.value;

    if (!todo || !dateValue || !timeValue) {
        alert("Please provide all details for the reminder.");
        return;
    }

    let dateTimeString = `${dateValue}T${timeValue}`;
    let scheduledTime = new Date(dateTimeString);
    let currentTime = new Date();
    let timeDifference = scheduledTime - currentTime;

    if (timeDifference > 0){
        addReminder(todo, dateTimeString);
        let timeoutId = setTimeout(() => {
            document.getElementById('notificationSound').play();
            new Notification(todo, { requireInteraction: true });
        }, timeDifference);
        timeoutIds.push(timeoutId);
        alert("Reminder set successfully!");
    } else {
        alert("The scheduled time is in the past!");
    }
}

function addReminder(todo, reminder){
    let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
    reminders.push({ task: todo, reminder: reminder });
    localStorage.setItem("reminders", JSON.stringify(reminders));
}
