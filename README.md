# Discord PlaTRON
Multi purpose discord bot running on discord-akairo and node 8

## Invite

https://discordapp.com/oauth2/authorize?client_id=344908093274193922&scope=bot&permissions=268435464

## Configuration
This command requires `ADMINISTRATOR` permissions!
`!config set <field> <value>`

1. autoDeleteMessages: *boolean* (default:true)   
Automatically deletes registration messages to clear up spam
2. setVerifiedRoles: *boolean* (default:false)   
3. setCountryRoles: *boolean* (default:false)   
4. setDivisionRoles: *boolean* (default:false)   
5. setMURoles: *boolean* (default:false)   
5. setMavericRoles: *boolean* (default:false)   
6. countryRole: *role* (default:false)   
7. setPartyRoles: *boolean* (default:false)   
8. setCongressRoles: *boolean* (default:false)   
9. epicNotificator: *channel/false* (default:false)   
10. greetMembers: *boolean* (default:false)   
11. greetMessage: *string/false* (default:false)   
Use `{user}` and `{guild}` for string interpolation
12. enableCommands: *boolean* (default:false)

## Configuring roles
This command requires `ADMINISTRATOR` permissions!
`!role set <role_name> <role>`

1. div1
2. div2
3. div3
4. div4
5. maveric

For example, `!role set div1 @DIV1` or just `!role set div1 DIV1` (Bot will automatically resolve that role without mentioning it)