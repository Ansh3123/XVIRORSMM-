const fs = require('fs');
let code = fs.readFileSync('src/pages/NewOrder.tsx', 'utf8');

// I'll replace everything between 'export function NewOrderContent' up to 'const handleSubmit'
const start = code.indexOf('export function NewOrderContent');
const end = code.indexOf('const handleSubmit');
const originalTop = code.substring(start, end);

const newTop = `export function NewOrderContent({ isWidget = false }: { isWidget?: boolean }) {
  const { user, userData } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const location = useLocation();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        let finalServices: Service[] = [];
        try {
          finalServices = await fetchSMMServices();
        } catch (apiErr) {
          console.error('Failed to fetch SMM helper services:', apiErr);
        }
        
        setServices(finalServices);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(finalServices.map(s => s.category)));
        setCategories(uniqueCategories);
        
        // Prefill from URL if provided
        const params = new URLSearchParams(location.search);
        const prefillServiceId = params.get('service');
        const srv = finalServices.find(s => s.id === prefillServiceId);
        
        if (srv) {
           setSelectedCategory(srv.category);
           setSelectedServiceId(srv.id);
        } else if (uniqueCategories.length > 0) {
           setSelectedCategory(uniqueCategories[0]);
           const firstService = finalServices.find(s => s.category === uniqueCategories[0]);
           if (firstService) setSelectedServiceId(firstService.id);
        }
      } catch (err) {
        console.error("Global fetchServices Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [location, userData]);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const charge = selectedService && quantity ? (selectedService.price / 1000) * parseInt(quantity) : 0;

  `;

code = code.replace(originalTop, newTop);

// I also need to fix the JSX where I broke `{true && (`
const jsxMatch = code.match(/\{true && \([\s\S]*?\)\}/);
// wait, looking at my previous grep:
// `            {true && (`
// Let's replace the category select part in the JSX
const jsxStart = code.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">');
const jsxEnd = code.indexOf('<div>\n              <label className="block text-sm font-medium text-gray-700">Link</label>');

if (jsxStart !== -1 && jsxEnd !== -1) {
    const originalJSX = code.substring(jsxStart, jsxEnd);
    const newJSX = `<div className="grid grid-cols-1 gap-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const firstSrv = services.find(s => s.category === e.target.value);
                  if (firstSrv) setSelectedServiceId(firstSrv.id);
                  else setSelectedServiceId('');
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {services.filter(s => s.category === selectedCategory).map(s => (
                  <option key={s.id} value={s.id}>{s.name} (₹{s.price.toFixed(4)} / 1000)</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        `;
    code = code.replace(originalJSX, newJSX);
}

fs.writeFileSync('src/pages/NewOrder.tsx', code);
console.log('NewOrder.tsx restored');
