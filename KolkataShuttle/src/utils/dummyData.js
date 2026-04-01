export const routes = [
  {
    id: '1',
    name: 'Salt Lake Sector V → Rajarhat IT Hub',
    startPoint: 'Salt Lake Sector V',
    endPoint: 'Rajarhat IT Hub',
    stops: ['DLF Galleria', 'Webel More', 'Unitech'],
    time: '8:30 AM',
    fare: { ac: 60, nonAc: 40 },
    busType: 'both',
  },
  {
    id: '2',
    name: 'New Town → Ecospace',
    startPoint: 'New Town Bus Stand',
    endPoint: 'Ecospace Business Park',
    stops: ['Chinar Park', 'Axis Mall'],
    time: '9:00 AM',
    fare: { ac: 50, nonAc: 30 },
    busType: 'ac',
  },
  {
    id: '3',
    name: 'Rajarhat → Salt Lake Sector V',
    startPoint: 'Rajarhat',
    endPoint: 'Salt Lake Sector V',
    stops: ['Unitech', 'Webel More', 'DLF Galleria'],
    time: '5:30 PM',
    fare: { ac: 60, nonAc: 40 },
    busType: 'both',
  },
];

export const seatLayout = {
  bookedSeats: ['2A', '3B', '5C'],
};

export const myBookings = [
  {
    id: 'b1',
    routeName: 'Salt Lake Sector V → Rajarhat IT Hub',
    date: '2025-04-15',
    time: '8:30 AM',
    seats: ['2A'],
    busType: 'AC',
    fare: 60,
    status: 'upcoming',
  },
  {
    id: 'b2',
    routeName: 'New Town → Ecospace',
    date: '2025-04-14',
    time: '9:00 AM',
    seats: ['4B', '4C'],
    busType: 'AC',
    fare: 100,
    status: 'completed',
  },
];