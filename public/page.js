var searchResultsArr = [];
var currentSymptomCategory = 'Behaviour'; // Default symptom category
var currrentResult = {}; // Default current search result

var map = new Map();
var count = 0;

var elementSelectedId = '';
var fontValue = 'Italic';
var storedFonts = [];

var settingSelectedId = '';
var currentPage = '';

localStorage.setItem("load", false);
var load = localStorage.getItem("load");

setTimeout(init, 1500);

async function downloadPage() {
    const response = await fetch('/downloadImage')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a')
    a.href = "https://www.workintool.com/image-converter/image-to-word.html";
   
    document.body.appendChild(a);
    a.click();

   
        a.remove();
        window.URL.revokeObjectURL(url);
  

}


async function init() {
    // If it does not exist
    if (load === null || load === undefined)
        localStorage.setItem("load", false);

    // if count > 1
    if (count >= 1)
        localStorage.setItem("load", true);

    load = localStorage.getItem("load");

    if (load === 'false') {
        const dataStore = await getDatastore();
        console.log(dataStore);
        const symptoms = dataStore.Symptoms;

        console.log(symptoms)

        if (symptoms !== undefined && symptoms !== null) {
            for (const [category, result] of Object.entries(symptoms)) {
                const items = [];

                for (const symptom of result) {

                    const Value = symptom.Value;
                    const DiseaseName = symptom.DiseaseName;
                    const Description = symptom.Description;

                    items.push({ DiseaseName: DiseaseName, Description: Description, Value: Value })
                }

                if (category === "Water quality")
                    map.set("Water-quality", items);
                else
                    map.set(category, items);
            }


            map.forEach((values, keys) => {
                const category = new String(keys);
                const container = `${category.toLowerCase()}`

                for (const result of values) {
                    addToList(result, container);
                }
            });
        }

        // Load fields
        const fields = dataStore.Fields;
        if (fields !== null || fields !== undefined || fields !== "") {
            for (const [category, category_fields] of Object.entries(fields)) {
                if (category_fields === undefined && category_fields === null && category_fields === "")
                    continue;

                console.log(category_fields);
                loadStyles(category_fields) // Set fields
            }
        }

        // Load settings
        const settings = dataStore.Settings;
        if (settings !== undefined && settings !== null) {
            for (const [setting, value] of Object.entries(settings)) {
                console.log("val " + value);
                let radio = document.querySelector(
                    'input[name="fish_id"][value="' + value + '"]'
                );
                if (setting === "Species") {
                    radio.checked = value;
                }
                else if (setting === "Water type") {
                    radio = document.querySelector(
                        'input[name="water"][value="' + value + '"]'
                    );

                    radio.checked = value;
                } else {
                    const tickbox = document.getElementById(setting);
                    tickbox.checked = value;
                }
            }
        }

        const pages = await loadPages();
        const select = document.getElementById('create-page');
        pages.Pages.forEach((item) => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });

        document.getElementById('create-page').value = pages.CurrentPage;
        document.getElementById('disease-page').textContent = pages.CurrentPage;
        // Set map
        for (const key of Object.keys(dataStore)) {
            console.log(key);
        }

        localStorage.setItem("load", true);
    }

    count += 1;
}

async function loadPages() {
    const response = await fetch('/getPages')
    const pages = await response.json();
    return pages;
}

async function getValue(event) {
    const id = event.currentTarget.id;
    const value = event.target.value;

    let settings = {};
    var currentElement = document.getElementById(id);
    if (currentElement.type === "checkbox") {
        isChecked = currentElement.checked;
        settings = { Category: id, Value: isChecked };
    } else {
        const name = event.currentTarget.name;
        if (name === "water")
            settings = { Category: "Water type", Value: value };
        else
            settings = { Category: "Species", Value: value };
    }

    // Save in database
    await saveSettings(settings);
}

async function saveSettings(settings) {
    const response = await fetch('/saveSettings', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Settings: settings,
        })
    });
}

async function changePage(page) {
    const response = await fetch('/changePage', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Page: page,
        })
    })

    if (response.status === 200)
        location.reload();
}

async function selectPage(event) {
    const page = event.target.value;
    currentPage = page;
    document.getElementById('disease-page').textContent = currentPage;
    await changePage(page);
}

async function createPage() {
    const text = window.prompt("Enter the name of the new page", "");
    if (text?.length > 30 || text === "" || text === null || text === undefined)
        alert("Invalid Entry")
    else {
        await fetch('/createPage', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Page: text,
            })
        }).then((res) => {

            const select = document.getElementById('create-page');
            const exists = Array.from(select.options)
                .some(option => option.value.toLowerCase() === text.toLowerCase());

            if (!exists) {
                const option = document.createElement('option');
                option.value = text;
                option.textContent = text;
                select.appendChild(option);
            }
        });
    }

}

async function saveValueBox(category, diseaseName, value) {
    const response = await fetch('/saveValueBox', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Category: category,
            DiseaseName: diseaseName,
            Value: value
        })
    });
}

async function loadJSON() {
    const response = await fetch('./datastore.json');
    const json = await response.json();
    console.log(json); // now you can use your JSON data
}

async function readSymptoms() {
    const response = await fetch('./symptoms.json')
    const symptoms = await response.json();
    return symptoms;
}

async function getDatastore() {
    const response = await fetch('/getDatastore')
    const datastore = await response.json();
    return datastore;
}

async function saveFieldStyles(id, innerText, selection, style) {
    const response = await fetch('/saveFieldStyles', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            innerText: innerText,
            selection: selection,
            style: style
        })
    });
}

async function deleteSymptom(category, diseaseName) {
    const items = map.get(category);

    if (items.some(d => d.DiseaseName === diseaseName)) {
        console.log("cat:", category + 'diseaseName: ' + diseaseName);
        const newSymptoms = items.filter(d => d.DiseaseName !== diseaseName);
        map.set(category, newSymptoms);

        const response = await fetch('/delete', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ container: category, symptom: newSymptoms }),
        });

        removeFromList(diseaseName, category);
    }
}

async function saveSymptom(container, symptom) {
    const response = await fetch('/save', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ container: container, symptom: symptom }),
    });
}

async function updateStyle() {
    const element = document.getElementById(elementSelectedId);
    let span = document.createElement('span');
    storedFonts.forEach((item) => {
        switch (item) {
            case "italic":
                {
                    span.style.fontStyle = "italic";
                    break;
                }
            case "bold":
                {
                    span.style.fontWeight = "bold";
                    break;
                }
            case "blue":
                {
                    span.style.color = "blue";
                    break;
                }
            case "green":
                {
                    span.style.color = "green";
                    break;
                }
        }
    });

    const value = element.innerText;
    const selection = window.getSelection().toString().trim();
    const index = value.indexOf(selection);

    let before = "";
    let after = "";

    if (index !== -1) {
        before = value.slice(0, index);
        after = value.slice(index + selection.length);
    }

    if (value.trim().includes(selection) || value === selection) {
        element.innerText = '';
        span.textContent = selection;

        if (getFontStyle() === "italic" || getFontStyle() === "bold") {
            if (getFontStyle() === "bold") {
                if (!storedFonts.includes(getFontStyle())) {
                    storedFonts.push(getFontStyle());
                    span.style.fontWeight = getFontStyle();
                }
            }
            else {
                if (!storedFonts.includes(getFontStyle())) {
                    storedFonts.push(getFontStyle());
                    span.style.fontStyle = getFontStyle();
                }
            }
        }

        if (getFontStyle() === "reset") {
            span.style.fontStyle = "";
            span.style.fontWeight = "";
            span.style.color = "";
            storedFonts = [];
        }

        if (getFontStyle() === "blue") {
            if (storedFonts.includes("green")) {
                storedFonts = storedFonts.filter(d => d !== "green");
                storedFonts.push(getFontStyle());
                span.style.color = getFontStyle();
            } else {
                if (!storedFonts.includes(getFontStyle())) {
                    storedFonts.push(getFontStyle());
                    span.style.color = getFontStyle();
                }
            }
        }
        else if (getFontStyle() === "green") {
            if (storedFonts.includes("blue")) {
                storedFonts = storedFonts.filter(d => d !== "blue");
                storedFonts.push(getFontStyle());
                span.style.color = getFontStyle();
            } else {
                if (!storedFonts.includes(getFontStyle())) {
                    storedFonts.push(getFontStyle());
                    span.style.color = getFontStyle();
                }
            }
        }

        await saveFieldStyles(elementSelectedId, value, selection, span.style); // We still need to save the css span classes associated with text
    }

    before = document.createTextNode(before);
    element.appendChild(before);
    element.appendChild(span);
    after = document.createTextNode(after);
    element.appendChild(after);
}

async function addSymptom() {
    if (currrentResult !== '' || currrentResult !== null || currrentResult !== undefined) {
        const items = map.get(currentSymptomCategory);
        console.log(map);
        const searchRes = items.some(d => d.DiseaseName === currrentResult.Result.DiseaseName);
        if (items === undefined || items === null || searchRes)
            return;
        // Prevent duplicates
        items.push(currrentResult.Result);
        map.set(currentSymptomCategory, items);
        // Send to database
        await saveSymptom(currentSymptomCategory, currrentResult.Result);
        addToList(currrentResult.Result, currentSymptomCategory);
    }
}

async function displaySymptoms(event) {
    try {
        const dropdownContent = document.getElementById('dropdownContent');
        const input = document.getElementById('search-symptom');
        const text = input.value.trim();

        if (text.length === 0) {
            searchResultsArr = [];
            dropdownContent.style.display = 'none';
            return;
        }

        const searchResults = await searchLex(text);

        if (!searchResults || searchResults.length === 0) {
            searchResultsArr = [];
            dropdownContent.style.display = 'none';
            return;
        }

        searchResultsArr = searchResults;
        dropdownContent.style.display = 'block';
        loadSearchResults();

    } catch (error) {
        console.error("Error in displaySymptoms:", error);
    }
}

async function searchLex(keyword) {
    const lowerKeyword = keyword.toLowerCase().trim();
    const symptoms = await readSymptoms();

    if (!lowerKeyword) return [];

    return symptoms
        .map(item => {
            const name = item.DiseaseName.toString();
            const lowerName = name.toLowerCase();

            let score = 0;

            if (lowerName.includes(lowerKeyword)) {
                score += 100;
            }

            if (lowerName.startsWith(lowerKeyword)) {
                score += 50;
            }

            const common = [...lowerKeyword].filter(char => lowerName.includes(char)).length;
            score += common;

            score -= Math.abs(lowerName.length - lowerKeyword.length) * 0.1;

            return { item, score };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(result => result.item)
        .slice(0, 50); // 👈 limit to 50 results
}

async function removeFromList(diseaseName, category) {
    const container = `${category.toLowerCase()}-container`;
    const collapsible_container = document.getElementById(container);
    const symptom_rows = collapsible_container.querySelectorAll(".symptom-row");//.querySelectorAll(`#${diseaseName}`);

    console.log(collapsible_container);
    symptom_rows.forEach(row => {
        if (row.id === diseaseName) {
            row.remove();
            return;
        }
    });
}

async function addToList(currentResult, container) {
    const result = currentResult;

    let category = container;//.split('-')[0];
    container = `${category.toLowerCase()}-container`;
    console.log(container);
    const collapsible_container = document.getElementById(container);

    const symptom_row = document.createElement("div");
    const p = document.createElement("p");
    const valueBox = document.createElement("input");
    const span = document.createElement("span");

    // console.log(result.DiseaseName);
    p.textContent = result.DiseaseName;
    span.textContent = "✖";

    const capitalized =
        category.charAt(0).toUpperCase() + category.slice(1);
    // add attributes for deletion
    span.setAttribute("Category", capitalized);
    span.setAttribute("DiseaseName", result.DiseaseName);

    span.onclick = (event) => {
        const element = event.currentTarget;

        const category = element.getAttribute('Category');
        const diseaseName = element.getAttribute('DiseaseName');

        deleteSymptom(category, diseaseName);
    };

    valueBox.type = "text";
    valueBox.setAttribute("Category", category);
    valueBox.id = `${result.DiseaseName}`
    valueBox.value = result.Value;

    var handler = async (event) => {
        const typedValue = event.target.value;
        const c = valueBox.getAttribute("Category");
        const category = c.charAt(0).toUpperCase() + c.slice(1);
        const diseaseName = valueBox.id;
        const numberValue = Number(typedValue);
        // Check if valid number
        if (!isNaN(numberValue) && numberValue >= 1 && numberValue <= 10) {
            await saveValueBox(category, diseaseName, typedValue);
        }
    };

    valueBox.onmousedown = handler;
    valueBox.oninput = handler;

    symptom_row.appendChild(p);
    symptom_row.appendChild(valueBox);
    symptom_row.appendChild(span);

    symptom_row.className = "symptom-row";
    symptom_row.id = result.DiseaseName;
    // collapsibleDiv.appendChild(symptom_row);
    collapsible_container.appendChild(symptom_row);
}

function setSelectedElementId(event) {
    const id = event.currentTarget.id;
    elementSelectedId = id;
    console.log(elementSelectedId);
}

function changeFontValue(event) {
    const val = event.target.value;
    fontValue = val;
    console.log("Font Value:", val);
}

function getFontStyle() {
    switch (fontValue) {
        case "Italic":
            return "italic";
        case "Bold":
            return "bold";
        case "Blue Text":
            return "blue";
        case "Green Text":
            return "green";
        case "Reset":
            return "reset";
    }
}

function loadStyles(field) {
    const element = document.getElementById(field.id);
    let span = document.createElement('span');

    const value = field.innerText;
    const selection = field.selection;
    if (selection === null || selection === undefined)
        return;

    const index = value.indexOf(selection);

    let before = "";
    let after = "";

    if (index !== -1) {
        before = value.slice(0, index);
        after = value.slice(index + selection.length);
    }

    element.innerText = '';
    span.textContent = selection;

    span.style.fontStyle = field.style.fontStyle;
    span.style.fontWeight = field.style.fontWeight;
    span.style.color = field.style.color;

    storedFonts.push(field.style.fontStyle, field.style.fontWeight, field.style.color);

    before = document.createTextNode(before);
    element.appendChild(before);
    element.appendChild(span);
    after = document.createTextNode(after);
    element.appendChild(after);
}

function setCurrentSymptomCategory(event) {
    currentSymptomCategory = event.target.value;
}

function hideDropdown() {
    const dropdownContent = document.getElementById('dropdownContent');
    dropdownContent.style.display = 'none';
    dropdownContent.innerHTML = '';
    searchResultsArr = [];
}

function loadSearchResults() {
    const dropdownContent = document.getElementById('dropdownContent');

    if (!searchResultsArr || searchResultsArr.length === 0) {
        dropdownContent.style.display = 'none';
        searchResultsArr = [];
        return;
    }

    searchResultsArr.forEach(result => {
        const p = document.createElement("p");
        p.textContent = result.DiseaseName;
        p.className = "hover-pointer";

        p.onclick = () => {
            try {

                result.Value = null;
                currrentResult = { Result: result }; // TODO: Adjust
                document.getElementById('search-symptom').value = result.DiseaseName;

                // Clear and hide dropdown
                dropdownContent.style.display = 'none';
                searchResultsArr = [];

            } catch (error) {
                console.error("Error adding symptom:", error);
            }
        };

        dropdownContent.appendChild(p);
    });

    dropdownContent.style.display = 'block';
}

function toggleSymptoms() {
    const container = document.getElementById("behaviour-container");

    if (container) {
        container.style.display =
            container.style.display === "none" ? "block" : "none";
        return;
    }
}

function addOption(text) {
    const select = document.getElementById('createpage');

    const option = document.createElement('option');
    option.value = text;     // value equals text
    option.textContent = text;

    select.appendChild(option);
}

function getPage() {
    return currentPage;
}