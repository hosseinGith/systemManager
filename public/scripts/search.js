const membersCont = document.querySelector(".membersCont");
const loading = document.querySelector(".loading");
const type = document.querySelector("select[name='type']");
const searchValue = document.querySelector('[name="searchValue"]');

let allDocument = [];
let columns;
let oldSearch = "";
let newStart = 0;
(async () => {
  columns = await (await fetch("/columns")).json();
  columns = columns.columns;
})();
function submitFormSearch(e, form) {
  console.log(346);

  e.preventDefault();
  membersCont.textContent = "";
  search(searchValue.value.trim());
  newStart = null;
  start = 0;
}
async function search(val, start = 0) {
  loading.classList.remove("opacity-0");
  loading.classList.remove("pointer-events-none");
  oldSearch = val;
  try {
    let res = await (
      await fetch("/search", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          textSearch: val,
          start: start,
          type: type.value,
        }),
      })
    ).json();

    if (!columns) {
      columns = await (await fetch("/columns")).json();
      columns = columns.columns;
    }
    if (res.start) {
      newStart = res.start;
    }
    allDocument = res.data;
    if (allDocument.length === 0) {
      Swal.fire({
        icon: "info",
        text: start === 0 ? "موردی یافت نشد." : "موارد بیشتری یافت نشدند.",
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
    }

    for (let index = 0; index < allDocument.length; index++) {
      try {
        const item = allDocument[index];

        const birthDate = moment(item.birthDayDate, "jYYYY/jMM/jDD"); // تاریخ تولد شمسی
        const today = moment(); // تاریخ امروز شمسی

        const years = today.diff(birthDate, "years");
        birthDate.add(years, "years"); // اضافه کردن سال‌ها برای محاسبه باقی‌مانده ماه‌ها

        const months = today.diff(birthDate, "months");
        birthDate.add(months, "months"); // اضافه کردن ماه‌ها برای محاسبه باقی‌مانده روزها
        let days = today.diff(birthDate, "days");
        item["age"] = `${years ? years + " سال  " : ""} ${
          months ? (years ? " و " : "") + months + " ماه  " : ""
        } ${days > 0 ? (months ? " و " : "") + days + " روز" : ""} `;
        if (!item["age"].trim()) item["age"] = "تاریخ تولد نا معتبر";
        createLi(item, columns);
      } catch (e) {
        console.log(e);
      }
    }
  } catch (e) {
    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
    console.log(e);
  }
  loading.classList.add("opacity-0");
  loading.classList.add("pointer-events-none");
}
function createLi(data, columns) {
  let fragment = document.createDocumentFragment();
  let li = document.createElement("a");
  li.href = "/member/" + data.id;
  li.className = "border-8";
  li.style.padding = "10px";
  li.style.display = "flex";
  li.style.borderColor = "#32b85e";
  li.style.flexDirection = "column";
  li.style.gap = "10px";

  let idDiv = document.createElement("div");
  idDiv.className = "id";
  idDiv.style.display = "flex";
  idDiv.style.justifyContent = "space-between";
  idDiv.style.width = "100%";
  idDiv.innerHTML = `id: <span>${data.id}</span>`;
  if (searchValue.value == data.id) {
    idDiv.querySelector("span").style.color = "red";
    idDiv.style.fontWeight = "bold";
  }
  li.appendChild(idDiv);

  const createSection = (title, className) => {
    let section = document.createElement("div");
    section.className = className;
    section.style.gap = "5px";
    section.style.border = "2px solid #bbb";
    section.style.width = "100%";

    let header = document.createElement("h1");
    header.className = "p-2";
    header.textContent = title;
    header.style.background = "#2f569d";
    header.style.color = "#fff";
    header.style.width = "50%";
    header.style.margin = "0 auto";
    header.style.borderRadius = "0 0 20px 20px";

    let content = document.createElement("div");
    content.className = "grid grid-cols-1";

    section.appendChild(header);
    section.appendChild(content);

    return section;
  };

  let sections = {};
  let newColumns = [];
  Object.keys(data).forEach((key) => {
    let findValue = columns.find((col) => {
      if (typeof col.value === "string") col.value = JSON.parse(col.value);
      if (col.value[1] === key) return col;
    });
    if (findValue) {
      newColumns.push(findValue);
      sections[findValue.value[2].replaceAll(" ", "")] = createSection(
        findValue.value[2],
        findValue.value[2].replaceAll(" ", "")
      );
    }
  });
  Object.values(sections).forEach((section) => li.appendChild(section));
  newColumns.forEach((item) => {
    let targetSection = sections[item.value[2].replaceAll(" ", "")];
    if (targetSection) {
      let contentDiv = targetSection.querySelector("div");
      let fieldDiv = document.createElement("div");
      fieldDiv.className = `grid grid-cols-1 px-2 gap-4 w-full`;
      fieldDiv.style.textAlign = "start";

      let valueDiv = document.createElement("div");
      valueDiv.className = `flex ${item.value[1]} justify-between  p-1`;

      let label = document.createElement("span");
      label.style.fontWeight = "bold";

      label.textContent = `${item.value[0].replaceAll(":", "")}:`;

      let valueSpan = document.createElement("p");
      valueSpan.classList.add("sm:text-[17px]");
      valueSpan.classList.add("text-[13px]");

      valueDiv.appendChild(label);
      valueDiv.appendChild(valueSpan);
      fieldDiv.appendChild(valueDiv);
      contentDiv.appendChild(fieldDiv);
    }
  });
  for (const key in data) {
    let section = li.querySelector(`.${key} p`);
    if (section) {
      data[key] = data[key].split(searchValue.value);
      let enc = encodeURIComponent(
        "[,__@@__)شسی*!)_&, 654654__@@__)*!)_&]شسیشسی"
      );
      data[key] = data[key].join(enc + searchValue.value + enc);
      data[key] = data[key].split(enc);

      data[key].forEach((item, index) => {
        let valueSpan = document.createElement("span");
        if (
          String(searchValue.value) == item &&
          (type.value === key || type.value === "all")
        ) {
          valueSpan.style.color = "red";
        }
        valueSpan.textContent = item;
        section.appendChild(valueSpan);
      });
    }
  }

  fragment.appendChild(li);

  membersCont.appendChild(fragment);
}
let isLoading,
  start,
  stepPlus = 100;
window.onscroll = async function () {
  if (allDocument.length < stepPlus - 1 || type.value === "id") return;
  let B = document.body,
    DE = document.documentElement,
    O = Math.min(B.clientHeight, DE.clientHeight);

  if (!O) {
    O = B.clientHeight;
  }

  let S = Math.max(B.scrollTop, DE.scrollTop),
    C = Math.max(B.scrollHeight, DE.scrollHeight);
  if (
    (O + S == document.querySelector("footer").offsetTop ||
      O + S >= document.querySelector("footer").offsetTop - 100) &&
    !isLoading
  ) {
    if (!start) {
      start = 0;
    }
    if (newStart) {
      start = newStart;
      newStart = null;
    } else start += stepPlus;
    isLoading = true;
    await search(searchValue.value.trim(), start);
    isLoading = false;
  }
};
