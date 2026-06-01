-- Sample SQL to update album cover URLs
-- Replace <AlbumId> and file name accordingly

UPDATE Albums
SET CoverImageUrl = '/storage/pics/my-cover.jpg'
WHERE Id = '<AlbumId>';

-- Example for multiple albums:
-- UPDATE Albums SET CoverImageUrl = '/storage/pics/cover1.jpg' WHERE Id = 'album-id-1';
-- UPDATE Albums SET CoverImageUrl = '/storage/pics/cover2.jpg' WHERE Id = 'album-id-2';
