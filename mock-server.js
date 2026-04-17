import express from 'express';
import cors from 'cors';
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
let mockPersons = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    birthday: '1950-01-01',
    birthplace: 'New York',
    gender: 'male',
    motherId: null,
    fatherId: null
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Doe',
    birthday: '1952-03-15',
    birthplace: 'Boston',
    gender: 'female',
    motherId: null,
    fatherId: null
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Doe',
    birthday: '1975-06-20',
    birthplace: 'New York',
    gender: 'male',
    motherId: '2',
    fatherId: '1'
  }
];

// Routes matching the expected API endpoints
app.get('/make-server-753cbdd3/persons', (req, res) => {
  console.log('GET /make-server-753cbdd3/persons');
  res.json({
    success: true,
    data: mockPersons
  });
});

app.get('/make-server-753cbdd3/persons/:id', (req, res) => {
  const id = req.params.id;
  console.log(`GET /make-server-753cbdd3/persons/${id}`);
  const person = mockPersons.find(p => p.id === id);
  
  if (person) {
    res.json({
      success: true,
      data: person
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Person not found'
    });
  }
});

app.post('/make-server-753cbdd3/persons', (req, res) => {
  console.log('POST /make-server-753cbdd3/persons', req.body);
  const newPerson = {
    id: String(mockPersons.length + 1),
    ...req.body
  };
  mockPersons.push(newPerson);
  
  res.status(201).json({
    success: true,
    data: newPerson
  });
});

app.put('/make-server-753cbdd3/persons/:id', (req, res) => {
  const id = req.params.id;
  console.log(`PUT /make-server-753cbdd3/persons/${id}`, req.body);
  const index = mockPersons.findIndex(p => p.id === id);
  
  if (index !== -1) {
    mockPersons[index] = { ...mockPersons[index], ...req.body, id };
    res.json({
      success: true,
      data: mockPersons[index]
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Person not found'
    });
  }
});

app.delete('/make-server-753cbdd3/persons/:id', (req, res) => {
  const id = req.params.id;
  console.log(`DELETE /make-server-753cbdd3/persons/${id}`);
  const index = mockPersons.findIndex(p => p.id === id);
  
  if (index !== -1) {
    mockPersons.splice(index, 1);
    res.json({
      success: true,
      data: null
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Person not found'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Mock API server running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET    /make-server-753cbdd3/persons');
  console.log('  GET    /make-server-753cbdd3/persons/:id');
  console.log('  POST   /make-server-753cbdd3/persons');
  console.log('  PUT    /make-server-753cbdd3/persons/:id');
  console.log('  DELETE /make-server-753cbdd3/persons/:id');
  console.log('  GET    /api/health');
});
