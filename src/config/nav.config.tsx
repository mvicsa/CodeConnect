import { Home, MessageCircleMore, Hash } from "lucide-react";

const navItems = [
  {
    name: "Home",
    href: "/",
    iconFilled: <Home fill="currentColor" className="w-6 h-6" />,
    iconOutline: <Home  className="w-6 h-6" />,
  },
  {
    name: "Messages",
    href: "/chat",
    iconFilled: <MessageCircleMore fill="currentColor" className="w-6 h-6" />,
    iconOutline: <MessageCircleMore  className="w-6 h-6" />,
  },
  {
    name: "Tags",
    href: "/tags",
    iconFilled: <Hash fill="currentColor" className="w-6 h-6" />,
    iconOutline: <Hash  className="w-6 h-6" />,
  },
  // {
  //   name: "Block Management",
  //   href: "/blocks",
  //   iconFilled: <UserX fill="currentColor" className="w-6 h-6" />,
  //   iconOutline: <UserX className="w-6 h-6" />,
  // },
];

export default navItems;
