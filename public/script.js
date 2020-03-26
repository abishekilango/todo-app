const url = "";
let cols;
const mql = window.matchMedia("(max-width: 800px)");
function renderBody(event) {
    if (event.matches) {
        cols = 2;
        fetchDataAndRenderTabs();
    } else {
        cols = 4;
        fetchDataAndRenderTabs();
    }
}
mql.addListener(renderBody);

let columnHeights = [0, 0, 0, 0];
function getColumn(limit) {
    let min = 0;
    for (let i = 1; i < limit; i++) {
        if (columnHeights[i] < columnHeights[min]) {
            min = i;
        }
    }
    return min;
} 

function clearContainer() {
    const col = document.getElementsByClassName("column");
    for (let i = 0; i < col.length; i++) {
        col[i].innerHTML = "";
        columnHeights[i] = 0;
    }
}

function addTabToScreen(tabData) {
    const currentColumn = getColumn(cols);
    const tab = renderTab(tabData);
    document.getElementsByClassName("column")[currentColumn].appendChild(tab);
    columnHeights[currentColumn] += tab.offsetHeight;
    const tx = tab.getElementsByTagName("textarea");
    for (const t of tx)  {
        t.style.height = (t.scrollHeight) + "px";
    }
}

async function newTab() {
    fetch(url+"/api/newTab")
    .then(res => {
        res.json().then(data => {
            addTabToScreen(data, cols);
        })
        .catch(err => {
            console.log(err);
        })
    })
    .catch(err => {
        console.log(err);
    });
}

async function deleteTab(tabId) {
    fetch(url+"/api/deleteTab", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "tabId": tabId })
    })
    .then(() => {
        const tab = document.getElementById(tabId);
        tab.parentNode.removeChild(tab);
        closeModal();
    })
    .catch(err => {
        console.log(err);
    });
}

async function fetchDataAndRenderTabs() {
    clearContainer();
    fetch(url+"/api/todos")
    .then(res => {
        res.json().then(data => {
            data.forEach(tabData => {
                addTabToScreen(tabData);
            });
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err);
    });
}

function openModal(data) {
    const modal = document.getElementById("modal");
    const tab = renderTab(data, true);
    tab.classList.add("modal-content");
    tab.classList.remove("tab");
    modal.appendChild(tab);
    modal.style.display = "block";
    window.onclick = event => {
        if (event.target == modal) {
            closeModal();
        }
    }
    window.onkeydown = event => {
        if (event.keyCode === 27) {
            closeModal();
        }
    };
}

function closeModal() {
    fetchDataAndRenderTabs();
    const modal = document.getElementById("modal");
    modal.style.display = "none";
    modal.innerHTML = "";
}

function renderTab(data, modal = false) {
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.id = data._id;
    
    const title = document.createElement("textarea");
    title.id = "title";
    title.classList.add("text", "title");
    autosize(title);
    title.value = data.title;
    title.placeholder = "Title";
    title.style.height = "35px";
    title.oninput = event => {
        title.style.height = (title.scrollHeight) + "px";
        update(tab.id, -1, title.value);
    };
    title.style.cursor = "default";

    const delTabbtn = document.createElement("img");
    delTabbtn.src = "/images/trash.png";
    delTabbtn.alt = "delTabbtn";
    delTabbtn.classList.add("delTabbtn");
    delTabbtn.align = "right";
    delTabbtn.onclick = event => {
        if (confirm("Delete tab?")) {
            deleteTab(data._id);
        }
    }

    const list = renderList(data, modal);
    list.className = "list";

    if (modal === true) {
        delTabbtn.style.visibility = "visible";
        const addbtn = document.createElement("img");
        addbtn.src = "/images/addbtn.png";
        addbtn.alt = "addbtn";
        addbtn.className = "addbtn";
        
        const input = document.createElement("textarea");
        input.id = "input";
        input.placeholder = "List Item";
        input.style.height = "26px";
        input.style.width = "85%";
        input.className = "text";
        autosize(input);
        input.style.cursor = "default";
        title.onkeydown = event => {
            if (event.keyCode === 40) {
                if (list.childElementCount > 0) {
                    list.children[0].children[1].focus();
                } else {
                    input.focus();
                }
            }
        };

        const newItem = async (tabId, item) => {
            await postItem(tabId, list.childElementCount, item);
            list.appendChild(renderItem(tabId, list.childElementCount, item));
            const t = list.children[list.childElementCount-1].children[1];
            t.style.height = (t.scrollHeight) + "px";
            input.value = "";
            input.style.height = "20px";
        };

        input.onkeydown = event => {
            if (event.keyCode === 13) {
                event.preventDefault();
                if (input.value !== "") {
                    newItem(tab.id, input.value);
                }
            } else if (event.keyCode === 38) {
                list.lastElementChild.children[1].focus();
            }
        };
        addbtn.onclick = event => {
            newItem(tab.id, input.value);
        }

        const donebtn = document.createElement("button");
        donebtn.className = "donebtn";
        donebtn.innerHTML = "Done";
        donebtn.onclick = event => {
            closeModal();
        };

        tab.appendChild(title);
        tab.appendChild(delTabbtn);
        tab.appendChild(list);
        tab.appendChild(addbtn);
        tab.appendChild(input);
        tab.appendChild(donebtn);
    } else {
        if (data.title === "") {
            if (list.childElementCount === 0) {
                title.placeholder = "Empty List";
            } else {
                title.style.display = "none";
            }
        }

        title.onkeydown = event => {
            if (event.keyCode === 40) {
                if (list.childElementCount > 0) {
                    list.children[0].children[1].focus();
                }
            }
        };

        tab.onclick = event => {
            if (event.target != delTabbtn) {
                openModal(data);
            }
        };

        tab.appendChild(title);
        tab.appendChild(delTabbtn);
        tab.appendChild(list);
    }

    return tab;
}

function renderList(data, modal = false) {
    const list = document.createElement("ul");
    let idx = 0;
    if (data.list !== undefined) {
        data.list.forEach(element => {
            const li = renderItem(data._id, idx, element.item, element.checked, modal);
            idx++;
            list.appendChild(li);
        });
    }
    return list;
}

function renderItem(tabId, id, data, checked = false, modal = false) {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    const item = document.createElement("textarea");
    li.id = id;
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.onclick = event => { 
        onChecked(tabId, id, checkbox.checked); 
    }
    item.placeholder = "List Item";
    item.value = data;
    item.style.height = "26px";
    item.classList.add("text");
    if (checked) {
        item.classList.add("checked");
    }
    item.style.cursor = "default";
    autosize(item);

    li.appendChild(checkbox);
    li.appendChild(item);

    if (modal === true) {
        function insertAfter(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }
        const onEnter = (tabId, id, str) => {
            postItem(tabId, id+1, str)
            .then(() => {
                const li = renderItem(tabId, id+1, str, false, true);
                const tab = document.getElementById("modal").firstChild;
                const list = tab.children[2];
                insertAfter(li, list.children[id]);
                for (let i = id+2; i < list.childElementCount; i++) {
                    list.children[i].id = i;
                }
                li.children[1].focus();
            })
            .catch(err => {
                console.log(err);
            });
        };
    
        item.onkeydown = event => {
            if (event.keyCode === 38) {
                if (id === 0) {
                    document.getElementById("modal").firstChild.children[0].focus();
                } else {
                    document.getElementById("modal").firstChild.children[2].children[id-1].children[1].focus();
                }
            } else if (event.keyCode === 40) {
                if (id !== document.getElementById("modal").firstChild.children[2].childElementCount-1) {
                    document.getElementById("modal").firstChild.children[2].children[id+1].children[1].focus();
                } else {
                    document.getElementById("modal").firstChild.children[4].focus();
                }
            } else if (event.keyCode === 13) {
                event.preventDefault();
                let str = item.value;
                onEnter(tabId, id, str.slice(item.selectionStart));
                update(tabId, id, str.slice(0,item.selectionStart));
                item.value = str.slice(0,item.selectionStart);
            } else if (item.value === "" && event.keyCode === 8) {
                event.preventDefault();
                deleteItem(tabId, id)
                .then(() => {
                    document.getElementById("modal").firstChild.children[2].children[id-1].children[1].focus();
                })
                .catch(err => {
                    console.log(err);
                });
            }
        };

        item.oninput = event => {
            update(tabId, id, item.value);
        };

        const delbtn = document.createElement("img");
        delbtn.src = "/images/delbtn.png";
        delbtn.alt = "delbtn";
        delbtn.classList.add("delbtn");
        delbtn.align = "right";
        delbtn.onclick = event => {
            deleteItem(tabId, id);
        }
        li.appendChild(delbtn);
    }

    return li;
}

async function onChecked(tabId, idx, checked) {
    const item = document.getElementById("modal").firstChild.children[2].children[idx].children[1];
    if (checked) {
        item.classList.add("checked");
    } else {
        item.classList.remove("checked");
    }
    fetch(url+"/api/checkItem", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "tabId": tabId, "checked": checked, "idx": idx })
    })
    .then()
    .catch(err => {
        console.log(err);
    });
}

async function update(tabId, idx, item) {
    let url = "/api/update";
    if (idx === -1) {
        url += "Title";
    } else {
        url += "Item";
    }
    fetch(url+url, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "tabId": tabId, "item": item, "idx": idx })
    })
    .then()
    .catch(err => {
        console.log(err);
    });
}

async function postItem(tabId, idx, data) {
    fetch(url+"/api/postItem", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "tabId": tabId, "idx": idx, "newItem": data })
    })
    .then()
    .catch(err => {
        console.log(err);
    });
}

async function deleteItem(tabId, idx) {
    fetch(url+"/api/deleteItem", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "tabId": tabId, "idx": idx })
    })
    .then(() => {
        const tab = document.getElementById("modal").firstChild;
        const list = tab.children[2];
        list.removeChild(list.children[idx]);
        for (let i = idx; i < list.childElementCount; i++) {
            list.children[i].id = i;
        }
    })
    .catch(err => {
        console.log(err);
    });
}

renderBody(mql);