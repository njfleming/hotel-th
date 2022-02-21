import * as fs from 'fs'

const requests = []
const reservations = []
const rooms = []

const importData = () => {
    requests.push(...JSON.parse(fs.readFileSync('./jsonFiles/requests.json')))
    reservations.push(...JSON.parse(fs.readFileSync('./jsonFiles/reservations.json')))
    rooms.push(...JSON.parse(fs.readFileSync('./jsonFiles/rooms.json')))
}

const findOpenRooms = (closedRooms, reqObj) => {
    const openRooms = []
    
    for(let room in rooms){
        if(!closedRooms.includes(room.id) && room.allow_smoking === reqObj.is_smoker && room.num_beds >= reqObj.min_beds) openRooms.push(room)
    }
    
    return openRooms
}

const lowestPrice = (openArr, days) => {
    let lowest = Infinity
    let roomId = ""

    if(openArr.length === 0) return {"id":"N/A", "price":0}

    openArr.forEach(room => {
        const price = room.daily_rate * days + room.cleaning_fee
        if(price < lowest){
            lowest = price
            roomId = room.id
        }
    })

    return {"id":roomId, "price":lowest}
}

const handleNewRequest = (reqObj) => {
    const checkIn = new Date(reqObj.checkin_date)
    const checkOut = new Date(reqObj.checkout_date)

    const closedRooms = []
    
    reservations.forEach(el => {
        const resCI = new Date(el.checkin_date)
        const resCO = new Date(el.checkout_date)

        if(checkIn >= resCI && checkIn < resCO) closedRooms.push(el.room_id)
    })

    const openRooms = findOpenRooms(closedRooms, reqObj)
    const roomToReserve = lowestPrice(openRooms, ((checkOut - checkIn)/(86400000)))

    const newReservation = {
        "room_id": roomToReserve.id,
        "checkin_date": reqObj.checkin_date,
        "checkout_date": reqObj.checkout_date,
        "total_charge": roomToReserve.price
    }
    reservations.push(newReservation)
}

const handleAllRequests = () => {
    importData()
    requests.forEach(req => handleNewRequest(req))

    fs.writeFile("./jsonFiles/reservations.json", JSON.stringify(reservations), err => {
        if(err) {
            console.error(err)
            return
        }
    })

    // to clear out requests queue
    
    // fs.writeFile("./jsonFiles/requests.json", JSON.stringify([]), err => {
    //     if(err) {
    //         console.error(err)
    //         return
    //     }
    // })
}
handleAllRequests()

