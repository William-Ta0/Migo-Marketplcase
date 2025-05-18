import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../api/itemApi';

const CreateItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createItem(formData);
      navigate('/');
    } catch (error) {
      setError('Failed to create item');
    }
  };

  return (
    <div>
      <h2>Create New Item</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-control">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-block">
          Add Item
        </button>
        <button
          type="button"
          className="btn btn-block"
          onClick={() => navigate('/')}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreateItem; 