var pcsclite = require('pcsclite');

// command list
const _INIT_SELECT = [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01]
const _SELECT = [0x00, 0xC0, 0x00, 0x00]

const _CID  = [0x80, 0xb0, 0x00, 0x04, 0x02, 0x00, 0x0d]
const _THFULLNAME  = [0x80, 0xb0, 0x00, 0x11, 0x02, 0x00, 0x64]
const _ENFULLNAME  = [0x80, 0xb0, 0x00, 0x75, 0x02, 0x00, 0x64]
const _BIRTH  = [0x80, 0xb0, 0x00, 0xD9, 0x02, 0x00, 0x08]
const _GENDER  = [0x80, 0xb0, 0x00, 0xE1, 0x02, 0x00, 0x01]
const _ISSUER  = [0x80, 0xb0, 0x00, 0xF6, 0x02, 0x00, 0x64]
const _ISSUE  = [0x80, 0xb0, 0x01, 0x67, 0x02, 0x00, 0x08]
const _EXPIRE  = [0x80, 0xb0, 0x01, 0x6F, 0x02, 0x00, 0x08]
const _ADDRESS  = [0x80, 0xb0, 0x15, 0x79, 0x02, 0x00, 0x64]

class ThaiIDReader {
    onReader(reader){
        this.reader = reader;
        this.reader.connect((err, protocol) => {
            if (err) {
                this.errorcb(err)
                return this.readerExit();
            }
            return this.readData(protocol);
        })
    }

    async read(cb,errorcb){
        this.cb = cb;
        this.errorcb = errorcb;
        this.pcsc = pcsclite()
        this.pcsc.on('reader', (reader)=>this.onReader(reader))
        this.pcsc.on('error', (err)=>this.onPcscError(err))
    }

     async readData (protocol) {
        let result = {};
        try {
            await this.sendCommand(_INIT_SELECT, protocol);
            result.cid = await this.sendCommand(_CID, protocol, true);
            result.fullname = await this.sendCommand(_THFULLNAME, protocol, true);
            result.dob = await this.sendCommand(_BIRTH, protocol, true);
            result.gender = await this.sendCommand(_GENDER, protocol, true);
            result.address = await this.sendCommand(_ADDRESS, protocol, true);
        } catch(e) {
            this.errorcb(e)
        }
        this.readerExit();
        this.cb( result );
    }

    async sendCommand (command, protocol, select) {
        let data = null
        let commands = [command]
        if (select) commands.push( _SELECT.concat(command.slice(-1)) )
        for(let i in commands) {
            data = await this.transmit( commands[i], protocol)
        }
        //console.log(commands)
        return this.hex2string(data.toString('hex'))
    }

    async transmit (command, protocol) {
      	return new Promise((resolve, reject) => {
	        this.reader.transmit(Buffer.from(command), 256, protocol, (err, data) => {
				if(err) {
					reject(err)
				}
				else {
					resolve(data)
				}
	        })
      	})
    }

    hex2string (input) {
		let tempHex = input
		if (tempHex.length > 4) tempHex = tempHex.slice(0, -4)
		const patt = /^[a-zA-Z0-9&@.$%\-,():`# \/]+$/
		const hex = tempHex.toString()
		let str = ''
		let tmp = ''
		for (let i = 0; i < hex.length; i += 2) {
			tmp = String.fromCharCode(parseInt(hex.substr(i, 2), 16))
			if (!tmp.match(patt)) {
				tmp = String.fromCharCode(parseInt(hex.substr(i, 2), 16) + 3424)
			}
			str += tmp
		}
		str = str.replace(/#/g, ' ').trim()
		return str
    }

    onPcscError(err){
        this.errorcb(err)
        this.pcscExit();
    }

    readerExit(){
        this.reader.disconnect(()=>{
            this.reader.close();
            this.pcscExit();
        });
    }

    pcscExit(){
        this.pcsc.close();
    }
}
module.exports = ThaiIDReader