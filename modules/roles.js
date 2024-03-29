const jsonfile = require("jsonfile");
const commonTags = require("common-tags");
const path = require( "path" );
const stripIndent = commonTags.stripIndent;
const stripIndents = commonTags.stripIndents;
const rolesPath = path.dirname(__dirname) + "/lists/roles.json";

module.exports = (client) => {
  
  // Because this line of code is used way too damn much
  function saveFile() {

    jsonfile.writeFileSync(rolesPath, roles, { spaces: 2 });

  }

  // Define main lists object
  let roles = {

    region: [],
    optin: []

  };

  // Obtain existing object, else create the file for it
  try {

    roles = jsonfile.readFileSync(rolesPath);

  }

  catch (e) {

    client.warn("Couldn't find roles.json, making a new one...");
    saveFile(); // it's basically the exact same line of code

  }

  // Selfrole command, allows the user to give a role to their user.
  let roleCmd = client.registerCommand("selfrole", 
  
  // function body
  (msg, args) => {

    args = args.join(" ");
    
    if (args.length === 0) return;

    let query = msg.channel.guild.roles.filter(r => (roles.region.includes(r.id) || roles.optin.includes(r.id)) && (r.id === args || r.name.toLowerCase() === args.toLowerCase()));
    
    if (query.length > 1) {

      let checkCaseQuery = query.filter(r => r.name === args);

      if (checkCaseQuery.length === 1) query = checkCaseQuery[0];

      else {

        return stripIndents`
        There are multiple opt-in roles with this name! Use the ID instead to self assign them.
        
        ${query.map(r => `**${r.name}** -- ${r.id}`).join("\n")}`;

      }
      
    }

    else if (query.length === 1) query = query[0];

    else return;

    if (roles.region.includes(query.id)) {

      let existing = msg.member.roles.filter(r => roles.region.includes(r));
      
      existing.forEach((roleid) => {

        if (roleid !== query.id) msg.member.removeRole(roleid, "Removing existing region role to add new one.");

      });

      msg.member.addRole(query.id, "Adding region role to user.");

      return `${msg.author.mention}, you are now a ${query.name}!`;

    }

    else if (roles.optin.includes(query.id)) {
      
      msg.member.addRole(query.id, "Adding optin role to user.");

      return `${msg.author.mention}, gave you the ${query.name} tag!`;

    }

  },

  // command options
  {

    aliases: [ "iam" ],
    guildOnly: true,
    description: "Give or remove roles from yourself.",
    fullDescription: "Give yourself one of the defined roles on the server. List roles with subcommand list. Remove roles with subcommand remove or not. You may only have one region role, but an unlimited amount of other roles.",
    usage: "<role name>"

  });

  // List subcommand, lists all possible roles to be self-assigned
  roleCmd.registerSubcommand("list",

  // function body
  (msg) => {

    return stripIndents`
    These are the roles you may currently assign yourself.
    
    **Region Roles**
    ${roles.region.length ? roles.region.map(roleid => msg.channel.guild.roles.get(roleid).name).join(", ") : "There are no region roles!"}
    
    **Opt-in Roles**
    ${roles.optin.length ? roles.optin.map(roleid => msg.channel.guild.roles.get(roleid).name).join(", ") : "There are no opt-in roles!"}`

  },

  // command options
  {

    guildOnly: true,
    description: "List all available self-assignable roles.",
    fullDescription: "Lists all available region and other roles that are self-assignable."

  });
  
  // Remove subcommand, allows the user to remove their own self-assignable tags.
  roleCmd.registerSubcommand("remove",

  // function body
  (msg, args) => {

    args = args.join(" ");
    let query = msg.channel.guild.roles.filter(r => (roles.region.includes(r.id) || roles.optin.includes(r.id)) && (r.id === args || r.name.toLowerCase() === args.toLowerCase()));

    if (query.length > 1) {

      let checkCaseQuery = query.filter(r => r.name === args);

      if (checkCaseQuery.length === 1) query = checkCaseQuery[0];

      else {

        return stripIndents`
        There are multiple opt-in roles with this name! Use the ID instead to remove them.
        
        ${query.map(r => `**${r.name}** -- ${r.id}`).join("\n")}`;

      }

    }

    else if (query.length === 1) query = query[0];

    else return;

    if (roles.region.includes(query.id) || roles.optin.includes(query.id)) {

      msg.member.removeRole(query.id, "Removing opt-in role from user.");

      return `${msg.author.mention}, removed the ${query.name} tag from you!`;

    }

  },

  // command options
  {

    aliases: [ "not" ],
    guildOnly: true,
    description: "Allows the user to remove their own opt-in roles.",
    fullDescription: "Allows the user to remove their own opt-in roles.",
    usage: "<role name>"

  });

  // Mod commands
  // These commands allow the mods to define which roles are opt ins or not.

  // Optin role manager
  let optin = client.registerCommand("optin",

  // content
  stripIndent`
  Valid subcommands:
  
    **add** - adds a new opt-in role
    **remove** - removes an opt-in role
    **list** - lists current opt-in roles`,
  
  // command options
  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Allows for the management of opt-in roles. Subcommands add and remove.",
    fullDescription: "Allows for the management of opt-in roles.",
    usage: "<subcommand>"

  });

  // Add subcommand, adds a new opt-in role. If it doesn't already exist, a new role is created.
  optin.registerSubcommand("add",

  //function body
  (msg, args) => {

    args = args.join(" ");
    let query = msg.channel.guild.roles.filter(r => r.id === args || r.name.toLowerCase() === args.toLowerCase());

    if (query.length > 1) {

      let checkCaseQuery = query.filter(r => r.name === args);

      if (checkCaseQuery.length === 1) query = checkCaseQuery[0];
      
      else {

        return stripIndents`
        You have multiple roles with the same name! Use the ID instead to add this to the list.
      
        ${query.map(r => `**${r.name}** -- ${r.id}`).join("\n")}`

      }

    }

    else if (query.length === 1) query = query[0];

    else {

      msg.channel.guild.createRole({name: args}, "Creating new opt-in role.").then((role) => {
        
        roles.optin.push(role.id);
        saveFile();

      });

      return `Created a new opt-in role ${args}!`;

    }

    if (roles.optin.includes(query.id) || roles.region.includes(query.id)) return `${query.name} is already an opt-in role!`;

    roles.optin.push(query.id);
    saveFile();

    return `Added ${query.name} to the list of opt-in roles!`;

  },

  // command options
  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Adds an opt-in role.",
    fullDescription: "Adds an opt-in role. Can be used with existing roles or will create a new role. Will return IDs if multiple roles are found.",
    usage: "<role name or id>"

  });
  
  optin.registerSubcommand("remove",
  
  // function body
  (msg, args) => {

    args = args.join(" ");
    let query = msg.channel.guild.roles.filter(r => roles.optin.includes(r.id) && (r.id === args || r.name.toLowerCase() === args.toLowerCase()));

    if (query.length > 1) {
       
      let checkCaseQuery = query.filter(r => r.name === args);

      if (checkCaseQuery.length === 1) checkCaseQuery = checkCaseQuery[0];

      else {

        return stripIndents`
        You have multiple roles with the same name! Use the ID instead to add this to the list.
      
        ${query.map(r => `${r.name} -- ${r.id}`).join("\n")}`

      }

    }

    else if (query.length === 1) query = query[0];

    else return `${args} isn't an opt-in role!`;
    
    roles.optin.splice(roles.optin.indexOf(query.id), 1);
    saveFile();

    return `Removed ${query.name} as an opt-in role.`;

  },

  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Removes an opt-in role.",
    fullDescription: "Removes an opt-in role.",
    usage: "<role name or id>"

  });

  optin.registerSubcommand("list",

  // function body
  (msg) => {

    return roles.optin.length ? stripIndents`
    These are the current opt-in roles.
    
    ${roles.optin.map(roleid => `**${msg.channel.guild.roles.get(roleid).name}** - ${roleid}`).join("\n")}` : "There are no opt-in roles!";

  },

  // command options
  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Lists all opt-in roles.",
    fullDescription: "Lists all opt-in roles."

  });

  // Region role manager
  let region = client.registerCommand("region",

  //function body
  stripIndent`
  Valid subcommands:
  
    **add** - adds a new region role
    **remove** - removes a region role
    **list** - lists current region roles`,
  
  // command options
  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Allows for the management of region roles. Subcommands add and remove.",
    fullDescription: "Allows for the management of region roles.",
    usage: "<subcommand>"

  });

  // Add subcommand, adds a new opt-in role. If it doesn't already exist, a new role is created.
  region.registerSubcommand("add",

  //function body
  (msg, args) => {

    args = args.join(" ");
    let query = msg.channel.guild.roles.filter(r => r.id === args || r.name.toLowerCase() === args.toLowerCase());

    if (query.length > 1) {

      let checkCaseQuery = query.filter(r => r.name === args);

      if (checkCaseQuery.length === 1) query = checkCaseQuery[0];
      
      else {

        return stripIndents`
        You have multiple roles with the same name! Use the ID instead to add this to the list.
      
        ${query.map(r => `**${r.name}** -- ${r.id}`).join("\n")}`

      }

    }

    else if (query.length === 1) query = query[0];

    else {

      msg.channel.guild.createRole({name: args}, "Creating new region role.").then((role) => {
        
        roles.region.push(role.id);
        saveFile();

      });

      return `Created a new region role ${args}!`;

    }

    if (roles.optin.includes(query.id) || roles.region.includes(query.id)) return `${query.name} is already an opt-in role!`;

    roles.region.push(query.id);
    saveFile();

    return `Added ${query.name} to the list of region roles!`;

  },

  // command options
  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Adds a region role.",
    fullDescription: "Adds a region role. Can be used with existing roles or will create a new role. Will return IDs if multiple roles are found.",
    usage: "<role name or id>"

  });
  
  region.registerSubcommand("remove",
  
  // function body
  (msg, args) => {

    args = args.join(" ");
    let query = msg.channel.guild.roles.filter(r => roles.region.includes(r.id) && (r.id === args || r.name.toLowerCase() === args.toLowerCase()));

    if (query.length > 1) {
       
      let checkCaseQuery = query.filter(r => r.name === args);

      if (checkCaseQuery.length === 1) checkCaseQuery = checkCaseQuery[0];
      
      else {

        return stripIndents`
        You have multiple roles with the same name! Use the ID instead to add this to the list.
      
        ${query.map(r => `**${r.name}** -- ${r.id}`).join("\n")}`

      }

    }

    else if (query.length === 1) query = query[0];

    else return `${args} isn't a region role!`;

    roles.region.splice(roles.region.indexOf(query.id), 1);
    saveFile();

    return `Removed ${query.name} as a region role.`;

  },

  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Removes a region role.",
    fullDescription: "Removes a region role.",
    usage: "<role name or id>"

  });

  region.registerSubcommand("list",

  // function body
  (msg) => {

    return roles.region.length ? stripIndents`
    These are the current region roles.
    
    ${roles.region.map(roleid => `**${msg.channel.guild.roles.get(roleid).name}** - ${roleid}`).join("\n")}` : "There are no region roles!";

  },

  // command options
  {

    requirements: {

      userIDs: [ client.config.ownerID ],
      roleIDs: [ client.config.modsRoleID ]

    },

    guildOnly: true,
    description: "Lists all region roles.",
    fullDescription: "Lists all region roles."

  });


  // catch the deletion of optin roles
  client.on("guildRoleDelete", (guild, role) => {

    if (roles.optin.includes(role.id)) {

      roles.optin.splice(roles.optin.indexOf(role.id), 1);
      saveFile();

    }

    if (roles.region.includes(role.id)) {

      roles.region.splice(roles.region.indexOf(role.id), 1);
      saveFile();

    }

  });

};
