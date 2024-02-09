import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Card, Button, Accordion, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BACKEND_URL } from './constant';

function App() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [error, setError] = useState('');
  const [trafficWeatherData, setTrafficWeatherData] = useState<{ [key: string]: any[] }>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const [recentSearches, setRecentSearches] = useState<{ date: string; time: string; location: string }[]>([]);
  const [recentSearchesOpen, setRecentSearchesOpen] = useState(false);
  const [username, setUsername] = useState('');

  const getUserIPAddress = async () => {
    try {
      const response = await fetch('https://api.ipify.org/?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP address:', error);
      return Math.floor(Math.random() * 1000);
    }
  };

  useEffect(() => {
    const generateRandomUsername = async () => {
      try {
        const ipAddress = await getUserIPAddress();
        console.log("ipAddress: ", ipAddress);
        const randomNumber = Math.floor(Math.random() * 1000);
        const randomUsername = `${ipAddress}_user${randomNumber}`;
        setUsername(randomUsername);
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };
  
    generateRandomUsername();
  }, []);


  useEffect(() => {
    if (date && time) {
      const formattedDateTime = `${date}T${time}:00`;
      callLocationDataAPI(formattedDateTime);
    }
  }, [date, time]);

  useEffect(() => {
    const storedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(storedSearches);
  }, []);

  const handleImageLoad = () => {
    setLoadingImages(false);
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
  };

  const handleTimeChange = (event) => {
    setTime(event.target.value);
  };

  const handleLocationChange = async (event) => {
    const selected = event.target.value;
    setSelectedLocation(selected);
    updateRecentSearches(selected);
    try {
      const dateTime = `${date}T${time}:00`;
      await fetch(`${BACKEND_URL}/api/search/traffic-weather-forecast?date_time=${dateTime}&location=${selected}&username=${username}&justLog=true`);
    } catch (error) {
      console.error('Error when logging location search:', error);
    }
  };

  const callLocationDataAPI = async (dateTime) => {
    try {
      setError('');
      const response = await fetch(`${BACKEND_URL}/api/search/traffic-weather-forecast?date_time=${dateTime}&username=${username}`);
      const result = await response.json();
      if (result.data.error) {
        setError(result.data.message);
        setLocations([]);
      } else {
        const locations = Object.keys(result.data);
        setLocations(locations);
        setTrafficWeatherData(result.data)
      }
    } catch (error) {
      console.error('Error fetching traffic images:', error);
      setError('Error fetching data. Please try again later.');
    }
  };

  const updateRecentSearches = (location: string) => {
    const search = { date, time, location };
    const updatedSearches = [search, ...recentSearches.filter(item => item.location !== location)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleRecentSearch = (search) => {
    setDate(search.date);
    setTime(search.time);
    setSelectedLocation(search.location);
    toggleRecentSearches(); // Close recent searches after selecting one
  };

  const toggleRecentSearches = () => {
    setRecentSearchesOpen(!recentSearchesOpen);
  };

  return (
    <>
      <Form>
        {error && <Alert variant="danger" className="error-alert">{error}</Alert>}
        <Row className="date-time-inputs">
          <Col sm={6}>
            <Form.Control type="date" value={date} onChange={handleDateChange} />
          </Col>
          <Col sm={6}>
            <Form.Control type="time" value={time} onChange={handleTimeChange} />
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <Form.Control as="select" value={selectedLocation} onChange={handleLocationChange}>
              <option value="">Select location</option>
              {locations.map((location, index) => (
                <option key={index} value={location}>{location}</option>
              ))}
            </Form.Control>
          </Col>
          {selectedLocation && trafficWeatherData[selectedLocation] && (
            <Col sm={6}>
              <Card className="weather-card">
                <Card.Header className="weather-card-header">Weather</Card.Header>
                <Card.Body className="weather-card-body">
                  <div className="weather-condition">{trafficWeatherData[selectedLocation][0].forecast}</div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </Form>
      {recentSearches && recentSearches.length ? <div className="recent-search-container">
        <a onClick={toggleRecentSearches} className="recent-search-btn">
          <span className="arrow-icon">{recentSearchesOpen ? '▼' : '▶'}</span> Show Recent Searches
        </a>
        <div className={`recent-search-list ${recentSearchesOpen ? 'open' : ''}`}>
          <Accordion defaultActiveKey="0">
            <Accordion.Collapse eventKey="0">
              <div>
                {recentSearches.map((search, index) => (
                  <a key={index} onClick={() => handleRecentSearch(search)} className="recent-search-link">
                    {search.location} - {search.date} {search.time}
                  </a>
                ))}
              </div>
            </Accordion.Collapse>
          </Accordion>
        </div>
      </div>: null}

      <div className="gallery-container">
        {selectedLocation ? (
          trafficWeatherData[selectedLocation] && trafficWeatherData[selectedLocation].map((item, index) => (
            <div key={index} className="gallery-item">
              {loadingImages && <div className="spinner"></div>}
              <img src={item.image} alt={`Traffic at ${selectedLocation}`} onLoad={handleImageLoad} style={{ display: loadingImages ? 'none' : 'block' }} />
              <p>Location: {selectedLocation}</p>
            </div>
          ))
        ) : (
          locations.map(location => (
            trafficWeatherData[location].map((item, index) => (
              <div key={`${location}-${index}`} className="gallery-item">
                {loadingImages && <div className="spinner"></div>}
                <img src={item.image} alt={`Traffic at ${location}`} onLoad={handleImageLoad} style={{ display: loadingImages ? 'none' : 'block' }} />
                <p>Location: {location}</p>
              </div>
            ))
          ))
        )}
      </div>

    </>
  );
}

export default App;
