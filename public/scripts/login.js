
const loading = document.querySelector(".loading");
let isSignUp = false;

async function submitForm(e) {
  e.preventDefault();
  loading.classList.remove("opacity-0");
  loading.classList.remove("pointer-events-none");

  let data = {
    password: document.querySelector("input[name='password']").value,
    username: document.querySelector("input[name='username']").value,
    public_name: isSignUp
      ? document.querySelector("input[name='public_name']").value
      : "",
  };
  try {
    let res = await fetch(isSignUp ? "/signup" : "/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    let result = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: "success",
        text: result.message,
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      }).then(() => {
        location.reload();
      });
    } else {
      Swal.fire({
        icon: "error",
        text: result.message,
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    }).then(() => {
      location.reload();
    });
  }
  loading.classList.add("opacity-0");
  loading.classList.add("pointer-events-none");
}
function checkContainerHeight() {
  if (
    document.querySelector("#container form").scrollHeight + 20 >
    innerHeight
  ) {
    document.querySelector("#container").style.alignItems = "start";
  } else {
    document.querySelector("#container").style.alignItems = "";
  }
}
checkContainerHeight();
window.onresize = () => {
  checkContainerHeight();
};
