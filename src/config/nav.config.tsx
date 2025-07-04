import {
  HomeIcon as HomeSolid,
  HeartIcon as HeartSolid,
  BellIcon as BellSolid,
  ChatBubbleOvalLeftEllipsisIcon as MessageSolid,
} from "@heroicons/react/24/solid";
import {
  HomeIcon as HomeOutlined,
  HeartIcon as HeartOutlined,
  BellIcon as BellOutlined,
  ChatBubbleOvalLeftEllipsisIcon as MessageOutlined,
} from "@heroicons/react/24/outline";

const navItems = [
  {
    name: "Home",
    href: "/",
    iconFilled: <HomeSolid className="w-6 h-6" />,
    iconOutline: <HomeOutlined className="w-6 h-6" />,
  },
  {
    name: "Messages",
    href: "/profile",
    iconFilled: <MessageSolid className="w-6 h-6" />,
    iconOutline: <MessageOutlined className="w-6 h-6" />,
  },
  {
    name: "Notifications",
    href: "/profile",
    iconFilled: <BellSolid className="w-6 h-6" />,
    iconOutline: <BellOutlined className="w-6 h-6" />,
  },
  {
    name: "Profile",
    href: "/profile",
    iconFilled: <HeartSolid className="w-6 h-6" />,
    iconOutline: <HeartOutlined className="w-6 h-6" />,
  },
];

export default navItems;
