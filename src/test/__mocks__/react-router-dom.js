const React = require('react');

module.exports = {
	useNavigate: () => jest.fn(),
	MemoryRouter: ({ children }) => React.createElement('div', null, children),
	Link: ({ children, to }) => React.createElement('a', { href: to || '#' }, children),
};
