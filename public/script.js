let recipes;
let recipe;

function base_url() {
    return `${window.location.origin}/the-cookbook`;
}

function goto_view() {
    let goto_url = base_url() + "/view-recipe.html?rid=" + recipe.id;
    window.location.href = goto_url;
}

function goto_home() {
    let goto_url = base_url() + "/cookbook.html";
    window.location.href = goto_url;
}

function goto_add() {
    let goto_url = base_url() + "/edit-recipe.html";
    window.location.href = goto_url;
}

function goto_delete() {
    let goto_url = base_url() + "/delete-recipe.html?rid=" + recipe.id;
    window.location.href = goto_url;
}

async function goto_edit() {
    let goto_url = base_url() + "/edit-recipe.html?rid=" + recipe.id;
    window.location.href = goto_url;
}

async function goto_login() {
    let goto_url = base_url() + "/login.html";
    window.location.href = goto_url;
}


function render_recipes() {
    let recipe_list = document.getElementById("recipe_list");
    let recipe_template = document.getElementById("recipe_template");
    while (recipe_list.firstChild) {
        recipe_list.removeChild(recipe_list.lastChild);
    }
    recipes.forEach(elem => {
        let clone = recipe_template.cloneNode(true);
        clone.id = undefined;
        clone.style = "display;";
        clone.addEventListener("click", () => {
            window.location.href = base_url() + "/view-recipe.html?rid=" + elem.id;
        })
        clone.childNodes.forEach(first_node => {
            first_node.childNodes.forEach(second_node => {
                if (second_node.textContent && second_node.tagName != "BUTTON") {
                    if (second_node.textContent == "update") {
                        let date = new Date(elem[second_node.textContent]);
                        second_node.textContent = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear();
                    } else {
                        second_node.textContent = elem[second_node.textContent];
                    }
                }
            })
            
        })
        recipe_list.insertBefore(clone, recipe_list.firstChild);
    })
}

function unlock_delete() {
    recipe = {
        id: get_argument("rid")
    };
    let delete_timer = document.getElementById("delete_timer");
    let delete_button = document.getElementById("delete_button");
    let timeout = 5000;
    let passed = 0;
    setTimeout(() => {
        delete_button.disabled = false;
    }, timeout);

    let write_timer = () => {
        if (passed <= timeout / 1000)
            delete_timer.innerText = (timeout/1000 - passed).toString() + "s";
        passed++;
    }

    write_timer();
    setInterval(write_timer, 1000);
}

function render_recipe() {

    document.getElementById("recipe_title").textContent = recipe["title"];
    document.getElementById("recipe_subtitle").textContent = recipe["subtitle"];
    document.getElementById("recipe_from").textContent = recipe["from"];
    
    document.getElementById("recipe_ingredients").textContent = recipe["ingredients"];
    document.getElementById("recipe_method").textContent = recipe["method"];
    document.getElementById("recipe_notes").textContent = recipe["notes"];
    
    let date = new Date(recipe["update"]);
    let update = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear();
    update += " - " + date.getHours() + ":" + date.getMinutes();
    document.getElementById("recipe_update").textContent = update;

    document.getElementById("recipe_template").style = "display";
}

function get_recipes() {
    api_call("GET", "/api/recipe", (xhr) => {
        if (xhr) {
            let spinner = document.getElementById("spinner");
            spinner.style = "display: None;"
            recipes = JSON.parse(xhr.response);
            recipes.sort((a, b) => { return a.title.toUpperCase() < b.title.toUpperCase() ? 1 : -1})
            render_recipes();
        }
    })
}

function get_argument(key) {
    urlp=[];s=window.location.href.toString().split('?');s=s[1].split('&');for(i=0;i<s.length;i++){u=s[i].split('=');urlp[u[0]]=u[1];}
    return urlp[key];
}

function get_recipe() {
    api_call("GET", "/api/recipe?rid=" + get_argument("rid"), (xhr) => {
        if (xhr) {
            let spinner = document.getElementById("spinner");
            spinner.style = "display: None;"
            recipe = JSON.parse(xhr.response);
            render_recipe();
        }
    })
}

function delete_recipe() {
    api_call("DELETE", "/api/recipe?rid=" + get_argument("rid"), (xhr) => {
        if (xhr) {
            goto_home();
        }
    })
}

function ta_resize() {
    this.style.height = 0;
    this.style.height = (this.scrollHeight + 15) + "px";
}

function build_editor() {

    let rid;
    try {
        rid = get_argument("rid");
    } catch (err) {
        rid = -1;
    }
    if (rid >= 0) {
        api_call("GET", "/api/recipe?rid=" + rid, (xhr) => {
            if (xhr) {
                let recipe_form = document.getElementById("recipe_form");
                recipe_form.style = "display;"
                let spinner = document.getElementById("spinner");
                spinner.style = "display: None;"
                recipe = JSON.parse(xhr.response);
                recipe_form.childNodes.forEach(node => {
                    if (node.id && (node.tagName == "TEXTAREA" || node.tagName == "INPUT")) {
                        node.value = recipe[node.id.substring(7)];
                    }
                })
                const tx = document.getElementsByTagName("textarea");
                for (let i = 0; i < tx.length; i++) {
                    tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight + 15) + "px;overflow-y:hidden;");
                    tx[i].addEventListener("input", ta_resize, false);
                }      
            }
        })
    } else {
        let recipe_form = document.getElementById("recipe_form");
        recipe_form.style = "display;"
        let spinner = document.getElementById("spinner");
        spinner.style = "display: None;"
    }
}

function save_recipe() {
    if (!recipe) {
        recipe = {};
    }
    let recipe_form = document.getElementById("recipe_form");
    recipe_form.childNodes.forEach(node => {
        if (node.id && (node.tagName == "TEXTAREA" || node.tagName == "INPUT")) {
            recipe[node.id.substring(7)] = node.value;
        }
    })
    if (recipe.id) {
        api_call("PUT", "/api/recipe?rid=" + recipe.id, (xhr) => {
            if (xhr) {
                goto_view();
            }
        }, recipe);
    } else {
        api_call("POST", "/api/recipe", (xhr) => {
            if (xhr) {
                recipe = JSON.parse(xhr.response);
                goto_view();
            }
        }, recipe);
    }
}

function search() {
    let first = document.getElementById("search_input").value.toUpperCase().trim();
    let scores = [];
    recipes.forEach(elem=> {
        let score = 0;
        for (let prop in elem) {
            let second = elem[prop].toString().toUpperCase().trim();
            if (second.search(first) >= 0) score += 10;
            for (var i = 0; i < first.length; i++) {
                if (second.search(first.charAt(i)) >= 0) score += 0.1;
            }
        }
        elem.score = score;
        console.log(elem.title +  " - " + score);
    });
    recipes.sort((a, b) => { return a.score > b.score ? 1 : -1})
    render_recipes();
}

function http_request(method, appended_url, callback, unauth_callback, body_content=undefined) {
    let xhr = new XMLHttpRequest();
    let url = `${base_url()}${appended_url}`;
    xhr.open(method, url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    //xhr.setRequestHeader('Authorization', 'Bearer ' + keycloak.token);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = (e) => {
        if (xhr.status == 200) {
            callback(xhr);
        } else if (xhr.status == 401) {
            unauth_callback();
        }
    }
    xhr.onerror = (e) => {
        callback(undefined);
    }
    if (body_content) {
        xhr.send(JSON.stringify(body_content));
    } else {
        xhr.send();
    }

}

function api_call(method, appended_url, callback, body_content=undefined) {

    http_request(
        method,
        appended_url,
        callback,
        () => {
            goto_login();
        },
        body_content
    );

}

function login() {

    let username = document.getElementById("username_input").value;
    let password = document.getElementById("password_input").value;

    http_request(
        "POST",
        "/login",
        () => {
            goto_home();
        },
        () => {
            document.getElementById("username_input").value = "";
            document.getElementById("password_input").value = "";
            alert('Le credenziali sono invalide');
        },
        {
            u: username,
            p: password
        }
    )
}

function logout() {

    api_call("GET", "/logout", (xhr)=> {
        window.location.href = base_url();
    })

}