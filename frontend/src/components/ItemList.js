import React from 'react';
import { Link } from 'react-router-dom';

const ItemList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p>No items found.</p>;
  }

  return (
    <div>
      {items.map(item => (
        <div
          key={item._id}
          className={`item ${item.completed ? 'completed' : ''}`}
        >
          <h3>
            <Link to={`/item/${item._id}`}>{item.name}</Link>
          </h3>
          <p>{item.description}</p>
          <p>Status: {item.completed ? 'Completed' : 'Not Completed'}</p>
        </div>
      ))}
    </div>
  );
};

export default ItemList; 