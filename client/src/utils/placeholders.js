/**
 * Returns a category-aware real image URL
 * for items that don't have an uploaded image.
 */

const CATEGORY_IMAGES = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
  documents:   'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80',
  wallet:      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
  keys:        'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80',
  bags:        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  clothing:    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
  books:       'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
  stationery:  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80',
  jewelry:     'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
  accessories: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
  other:       'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80';

/**
 * Get placeholder image URL for a given category.
 * @param {string} category - Item category (e.g. 'electronics', 'keys')
 * @returns {string} - Image URL
 */
export const getPlaceholderImage = (category) => {
  return CATEGORY_IMAGES[category?.toLowerCase()] || DEFAULT_IMAGE;
};

export default CATEGORY_IMAGES;
