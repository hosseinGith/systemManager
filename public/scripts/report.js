(async function () {
  let columns = await (await fetch("/columns")).json();
  columns = columns.columns;
  let allInfo = await (
    await fetch("/getMemebrsData/chart", { method: "GET" })
  ).json();
  Object.keys(allInfo).forEach((key) => {
    let title = document.createElement("h1");
    title.className = "text-lg sm:text-2xl";
    let canvas = document.createElement("canvas");
    let allRow = [];
    let allCol = {};
    allInfo[key].forEach((item) => {
      if (typeof item !== "string") return;
      if (!allRow.includes(item)) {
        if (key === "birthDayDate") {
          const birthDate = moment(item, "jYYYY/jMM/jDD");
          const today = moment();

          const years = today.diff(birthDate, "years") + " سال";
          const months = today.diff(birthDate, "months") + " ماه";
          const days = today.diff(birthDate, "days") + " روز";
          let property = years;
          if (today.diff(birthDate, "years") == 0) property = months;
          if (
            today.diff(birthDate, "months") == 0 &&
            today.diff(birthDate, "years") == 0
          )
            property = days;
          if (!allRow.includes(property)) allRow.push(property);
        } else allRow.push(item);
      }
      if (key === "birthDayDate") {
        allCol[allRow[allRow.length - 1]] = allCol[allRow[allRow.length - 1]]
          ? allCol[allRow[allRow.length - 1]] + 1
          : 1;
      } else allCol[item] = allCol[item] ? allCol[item] + 1 : 1;
    });
    document.querySelector("#contOfCharts").appendChild(title);
    document.querySelector("#contOfCharts").appendChild(canvas);

    let label = "";
    columns.forEach((item) => {
      if (typeof item.value === "string") item.value = JSON.parse(item.value);
      if (item.value[1] === key) label = item.value[0];
    });
    if (label === "تاریخ تولد") label = "سن";
    new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: allRow,
        datasets: [
          {
            label: "تعداد",
            data: Object.values(allCol),
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          zoom: {
            pan: {
              enabled: true,
              scaleMode: "y",
              overScaleMode: "y",
              threshold: 1,
            },
          },
        },
      },
    });
  });
})();
