const form = document.querySelector("form");
const loading = document.querySelector(".loading");

function formData() {
  let value = {};
  const inputs = document.querySelectorAll("form input");

  inputs.forEach((item) => {
    value[item.name] = item.value;
  });
  return value;
}

async function submitForm(e) {
  e.preventDefault();
  loading.classList.remove("opacity-0");
  loading.classList.remove("pointer-events-none");
  try {
    let res = await (
      await fetch("/add-property", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(formData()),
      })
    ).json();
    if (res.status)
      Swal.fire({
        icon: "success",
        text: res.message,
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
    else
      Swal.fire({
        icon: "error",
        text: res.message,
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
  } catch (e) {
    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
    console.error(e);
  }

  loading.classList.add("opacity-0");
  loading.classList.add("pointer-events-none");
}
