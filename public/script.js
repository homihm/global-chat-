const socket = io();

let currentUser = null;

function register() {
    fetch("/register", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            username:username.value,
            password:password.value
        })
    });
}

function login() {
    currentUser = username.value;
    document.getElementById("auth").style.display="none";
    document.getElementById("app").style.display="flex";

    socket.emit("join", currentUser);
}

function sendMessage() {
    const input = document.getElementById("input");
    if(input.value.trim() !== ""){
        socket.emit("chat message", input.value);
        input.value="";
    }
}

function showChat(){
    messages.style.display="block";
    info.style.display="none";
}

function showInfo(){
    messages.style.display="none";
    info.style.display="block";
}

socket.on("chat message", (data)=>{
    const div=document.createElement("div");
    div.className="message";
    div.innerHTML=`<span style="color:${data.color};font-weight:bold;cursor:pointer;">
    ${data.user}</span>: ${data.message}`;

    div.querySelector("span").onclick=()=>{
        const msg=prompt("Private message:");
        if(msg){
            socket.emit("private message",{
                to:data.id,
                message:msg
            });
        }
    };

    messages.appendChild(div);
});

socket.on("load messages",(rows)=>{
    rows.forEach(msg=>{
        const div=document.createElement("div");
        div.className="message";
        div.innerHTML=`<span style="color:${msg.color};font-weight:bold;">
        ${msg.username}</span>: ${msg.message}`;
        messages.appendChild(div);
    });
});

socket.on("private message",(data)=>{
    const div=document.createElement("div");
    div.textContent="(Private) "+data.from+": "+data.message;
    div.style.color="red";
    messages.appendChild(div);
});

socket.on("users",(users)=>{
    sidebar.innerHTML="<h3>Online</h3>";
    for(let id in users){
        const div=document.createElement("div");
        div.textContent=users[id];
        sidebar.appendChild(div);
    }
});