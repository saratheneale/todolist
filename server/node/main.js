/**
 * Our data looks like this:
 * Project:
 *  ID: 1 (Opaque blob)
 *  Start Date: 0->1 (Datetime)
 *  Due Date: 0->1 (Datetime)
 *  Name: 1 (String)
 *  Priority: 1 (Integer)
 *  IsDone: 1 (Bool)
 *  IsIrrelevant: 1 (Bool)
 *  Alarms: 0->N (Alarms)
 *  Children: 0->N (Alarms, Projects, Tasks, or Notes)
 * Task:
 *  Identical to Project, except that the only valid Children
 *  are Notes.
 * Note:
 *  ID: 1 (Opaque blob)
 *  IsDone: 1 (Bool)
 *  IsIrrelevant: 1 (Bool)
 *  Text: 1 (String)
 * Alarm:
 *  ID: 1 (Opaque blob)
 *  Name: 1 (String)
 *  Type: 1 ("relative" or "absolute")
 *  Date: 1 (Datetime)
 *  Description 0->N (Notes)
 */
var dataStore = {
  revision: 0,
  projects: [],
  tasks: [],
  alarms: [],
  notes: []
};

//We want to start the Node toDoList server iff we are running in Node.
if(typeof require !== "undefined") {
  main();
}

function main () {
  var net = require('net');
  var server = net.createServer({allowHalfOpen: true}, listener);
  server.listen(8124, "::");
  server.listen(8124, "0.0.0.0");
  server.on('connection', function(conn) { log("connected", getRemoteIpAndPort(conn)); });
}

function listener(conn) {
  conn.on('data', clientData.bind(this, conn));
  conn.on('end',
      function(conn) {
        log("disconnected", getRemoteIpAndPort(conn));
        conn.end();
      }.bind(this, conn) );
}

/** Processes data that comes in from the client.
 *
 * The "projects", "tasks", "notes", "alarms" arrays in the following messages are optional.
 * The "revision" field is an integer. On startup, one issues a "transfer"
 * message to get the current revision and data state from the server.
 * Subsequent requests must provide the last known revision.
 *
 * Data modification requests which provide a revision that doesn't match
 * the latest in the server will be denied. Issue a "transfer" request to
 * get the latest state of the world, then retry your modification request.
 *
 * Successful data modification requests will return "OK $NEW_REVISION_NUMBER".
 *
 * Add: { "revision": 0, "action": "add", "projects": [], "tasks": [], "notes": [], "alarms": [] }
 * Delete: { "revision": 0, "action": "delete", "projects": [], "tasks": [], "notes": [], "alarms": [] }
 * Transfer: { "action": "transfer" }
 */
function clientData(conn, data) {
  try {
    var incomingData = JSON.parse(data.toString().trim());
    var action = incomingData.action.toLowerCase();

    log(action, getRemoteIpAndPort(conn));
    switch(action) {
      case "transfer":
        handleTransfer(conn, incomingData);
        break;
      case "add":
        handleAdd(conn, incomingData);
        break;
      case "delete":
        handleDelete(conn, incomingData);
        break;
      default:
        throw Error("Unhandled action: '"+action+"'");

    }
  }
  catch(e) {
    log(e, getRemoteIpAndPort(conn));
    conn.write("ERROR " + e.toString());
  }
}

function handleTransfer(conn, incomingData) {
  conn.write(JSON.stringify(dataStore));
}

function handleAdd(conn, incomingData) {
  var revision = incomingData.revision;
  if(revision !== dataStore.revision) {
    writeOutOfDate(conn, revision, dataStore.revision);
    return;
  }
  log("Client rev #" + revision + " ok.", getRemoteIpAndPort(conn));

  var action = incomingData.action;
  var projects = incomingData.projects;
  var tasks = incomingData.tasks;
  var notes = incomingData.notes;
  var alarms = incomingData.alarms;

  add(projects, dataStore.projects);
  add(tasks, dataStore.tasks);
  add(notes, dataStore.notes);
  add(alarms, dataStore.alarms);

  log("OK " + dataStore.revision + " " + getRemoteIpAndPort(conn));
  conn.write("OK " + dataStore.revision);
}

function add(obj, datastoreObj) {
  if(typeof obj !== "undefined" && obj.length > 0) {
    for(var j = 0; j<obj.length;++j) {
      var item = obj[j];
      if(item.id===undefined) {
        throw Error("INVALID_ITEM_ADD at index " +
          j + " of array " + JSON.stringify(obj));
      }
    }
    dataStore.revision++;
    for(var i = 0; i < obj.length; ++i) {
      var newItem = obj[i];
      datastoreObj[newItem.id] = newItem;
    }
  }
}

function handleDelete(conn, incomingData) {
  var revision = incomingData.revision;
  if(revision !== dataStore.revision) {
    writeOutOfDate(conn, revision, dataStore.revision);
    return;
  }
  log("UNSUPPORTED ", getRemoteIpAndPort(conn));
  conn.write("UNSUPPORTED");
}

function getRemoteIpAndPort(conn) {
  return conn.remoteAddress + ":" + conn.remotePort;
}

function writeOutOfDate(conn, rev, dsRev) {
  log("OUT_OF_DATE (" + rev + "," + dsRev + ")", getRemoteIpAndPort(conn));
  conn.write("OUT_OF_DATE");
}

function log(string, ipAndPort) {
  console.log(new Date().toISOString() + " " + string + " " + ipAndPort);
}
