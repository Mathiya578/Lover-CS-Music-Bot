const got = require('got')
const Heroku = require('heroku-client')
const { secondsToHms, isUpdate, updateNow, bot } = require('../lib/')
const Config = require('../config')
const heroku = new Heroku({ token: Config.HEROKU_API_KEY })
const baseURI = '/apps/' + Config.HEROKU_APP_NAME

bot(
	{
		pattern: 'restart',
		fromMe: true,
		desc: 'Restart Dyno',
		type: 'heroku',
	},
	async (message, match) => {
		await message.send(`_Restarting_`)
		await heroku.delete(baseURI + '/dynos').catch(async (error) => {
			await message.send(`HEROKU : ${error.body.message}`)
		})
	}
)

bot(
	{
		pattern: 'shutdown',
		fromMe: true,
		desc: 'Dyno off',
		type: 'heroku',
	},
	async (message, match) => {
		await heroku
			.get(baseURI + '/formation')
			.then(async (formation) => {
				await message.send(`_Shuttind down._`)
				await heroku.patch(baseURI + '/formation/' + formation[0].id, {
					body: {
						quantity: 0,
					},
				})
			})
			.catch(async (error) => {
				await message.send(`HEROKU : ${error.body.message}`)
			})
	}
)

bot(
	{
		pattern: 'dyno',
		fromMe: true,
		desc: 'Show Quota info',
		type: 'heroku',
	},
	async (message, match) => {
		try {
			heroku
				.get('/account')
				.then(async (account) => {
					const url = `https://api.heroku.com/accounts/${account.id}/actions/get-quota`
					headers = {
						'User-Agent': 'Chrome/80.0.3987.149 Mobile Safari/537.36',
						Authorization: 'Bearer ' + Config.HEROKU_API_KEY,
						Accept: 'application/vnd.heroku+json; version=3.account-quotas',
					}
					const res = await got(url, { headers })
					const resp = JSON.parse(res.body)
					const total_quota = Math.floor(resp.account_quota)
					const quota_used = Math.floor(resp.quota_used)
					const remaining = total_quota - quota_used
					const quota = `Total Quota : ${secondsToHms(total_quota)}
Used  Quota : ${secondsToHms(quota_used)}
Remaning    : ${secondsToHms(remaining)}`
					await message.send('```' + quota + '```')
				})
				.catch(async (error) => {
					return await message.send(`HEROKU : ${error.body.message}`)
				})
		} catch (error) {
			await message.send(error)
		}
	}
)

bot(
	{
		pattern: 'setvar ?(.*)',
		fromMe: true,
		desc: 'Set heroku env',
		type: 'heroku',
	},
	async (message, match) => {
		if (!match)
			return await message.send(`_Example: .setvar SUDO:919876543210_`)
		const [key, value] = match.split(':')
		if (!key || !value)
			return await message.send(`_Example: .setvar SUDO:919876543210_`)
		heroku
			.patch(baseURI + '/config-vars', {
				body: {
					[key.toUpperCase()]: value,
				},
			})
			.then(async () => {
				await message.send(`_${key.toUpperCase()}: ${value}_`)
			})
			.catch(async (error) => {
				await message.send(`HEROKU : ${error.body.message}`)
			})
	}
)

bot(
	{
		pattern: 'delvar ?(.*)',
		fromMe: true,
		desc: 'Delete Heroku env',
		type: 'heroku',
	},
	async (message, match) => {
		if (!match) return await message.send(`_Example: delvar sudo_`)
		heroku
			.get(baseURI + '/config-vars')
			.then(async (vars) => {
				const key = match.trim().toUpperCase()
				if (vars[key]) {
					await heroku.patch(baseURI + '/config-vars', {
						body: {
							[key]: null,
						},
					})
					return await message.send(`_Deleted ${key}_`)
				}
				await message.send(`_${key} not found_`)
			})
			.catch(async (error) => {
				await message.send(`HEROKU : ${error.body.message}`)
			})
	}
)

bot(
	{
		pattern: 'getvar ?(.*)',
		fromMe: true,
		desc: 'Show heroku env',
		type: 'heroku',
	},
	async (message, match) => {
		if (!match) return await message.send(`_Example: getvar sudo_`)
		const key = match.trim().toUpperCase()
		heroku
			.get(baseURI + '/config-vars')
			.then(async (vars) => {
				if (vars[key]) {
					return await message.send(
						'_{} : {}_'.replace('{}', key).replace('{}', vars[key])
					)
				}
				await message.send(`${key} not found`)
			})
			.catch(async (error) => {
				await message.send(`HEROKU : ${error.body.message}`)
			})
	}
)

bot(
	{
		pattern: 'allvar',
		fromMe: true,
		desc: 'Heroku all env',
		type: 'heroku',
	},
	async (message, match) => {
		let msg = '```Here your all Heroku vars\n\n\n'
		heroku
			.get(baseURI + '/config-vars')
			.then(async (keys) => {
				for (const key in keys) {
					msg += `${key} : ${keys[key]}\n\n`
				}
				return await message.send(msg + '```')
			})
			.catch(async (error) => {
				await message.send(`HEROKU : ${error.body.message}`)
			})
	}
)

bot(
	{
		pattern: 'update$',
		fromMe: true,
		desc: 'Check new updates.',
		type: 'heroku',
	},
	async (message, match) => {
		const update = await isUpdate()
		if (!update.length) return await message.send('*Bot is up-to-date.*')
		return await message.send('*New updates*\n\n' + update.join('\n'))
	}
)

bot(
	{
		pattern: 'update now$',
		fromMe: true,
		desc: 'To-Up-Date bot.',
		type: 'heroku',
	},
	async (message, match) => {
		const isupdate = await isUpdate()
		if (!isupdate.length)
			return await message.send(
				'*Bot is up-to-date.*\n*Nothing to Update.*'
			)
		await message.send('_Updating..._')
		const e = await updateNow()
		if (e) return await message.send(e)
		return await message.send('_Updated_')
	}
) 
