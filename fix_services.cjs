const fs = require('fs');
let code = fs.readFileSync('src/pages/Services.tsx', 'utf8');

const start = code.indexOf('export function ServicesContent');
const end = code.indexOf('const filteredServices');

const newTop = `export function ServicesContent({ isWidget = false }: { isWidget?: boolean }) {
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        let finalServices: Service[] = [];
        try {
          finalServices = await fetchSMMServices();
        } catch (apiErr) {
          console.error('Failed to fetch from SMM helper:', apiErr);
        }
        
        setServices(finalServices);
        setCategories(['All', ...Array.from(new Set(finalServices.map(s => s.category)))]);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [isAdmin]);

  `;

code = code.replace(code.substring(start, end), newTop);

// Now the filtering part
const replaceFilter = "const filteredServices = services.filter(s =>";
const filterEnd = code.indexOf(");", code.indexOf(replaceFilter));
const oldFilter = code.substring(code.indexOf(replaceFilter), filterEnd + 2);

const newFilter = `const filteredServices = services.filter(s =>
    (selectedCategory === 'All' || s.category === selectedCategory) &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );`;
code = code.replace(oldFilter, newFilter);

// The UI part: Let's see what is inside the return statement
fs.writeFileSync('src/pages/Services.tsx', code);
