const form = document.querySelector("form");
const name = document.querySelector("#name");
const cost = document.querySelector("#cost");
const error = document.querySelector("#error");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (
    name.value.trim() &&
    cost.value.trim() &&
    !isNaN(parseFloat(cost.value))
  ) {
    const document = {
      name: name.value.trim(),
      cost: parseInt(cost.value),
    };

    db.collection("expenses")
      .add(document)
      .then(() => {
        error.textContent = "";
        name.value = "";
        cost.value = "";
      });
  } else {
    error.textContent = "Please enter values before submitting";
  }
});
