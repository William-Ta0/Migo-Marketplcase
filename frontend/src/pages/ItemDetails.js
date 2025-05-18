import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById, updateItem, deleteItem } from '../api/itemApi';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    completed: false,
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await getItemById(id);
        setItem(data);
        setFormData({
          name: data.name,
          description: data.description,
          completed: data.completed,
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch item');
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedItem = await updateItem(id, formData);
      setItem(updatedItem);
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update item');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        navigate('/');
      } catch (error) {
        setError('Failed to delete item');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <div>
      {isEditing ? (
        <div>
          <h2>Edit Item</h2>
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
            <div className="form-control form-control-check">
              <label>Completed</label>
              <input
                type="checkbox"
                name="completed"
                checked={formData.completed}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-block">
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-block"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <p>Status: {item.completed ? 'Completed' : 'Not Completed'}</p>
          <button className="btn" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button className="btn" onClick={handleDelete}>
            Delete
          </button>
          <button className="btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemDetails; 