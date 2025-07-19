'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    bio: '',
    skills: '',
    avatar: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(`http://localhost:4000/users/${id}`);
      const user = await res.json();

      const [firstname, lastname] = user.name?.split(' ') ?? ['',''];

      setFormData({
        firstname,
        lastname,
        bio: '',
        skills: user.skills.join(', '),
        avatar: user.avatar,
      });
      setImagePreview(user.avatar);
    };

    fetchUser();
  }, [id]);


  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setFormData((prev) => ({ ...prev, avatar: imageUrl }));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fullName = `${formData.firstname} ${formData.lastname}`;
    const updatedUser = {
      name: fullName,
      avatar: formData.avatar,
      skills: formData.skills.split(',').map(skill => skill.trim()),
      bio: formData.bio,
      updatedAt: new Date().toISOString()
    };

    await fetch(`http://localhost:4000/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    });

    router.push(`/en/profile/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-card p-8 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center">Edit Profile</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Right Column: Profile Picture + Bio */}
          <div>
            {/* Profile Picture */}
            <div className="mb-6 text-center md:text-left">
              <label className="block text-sm font-medium mb-2">Profile Picture</label>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="mx-auto md:mx-0 w-24 h-24 rounded-full object-cover mb-2 border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full file:bg-primary file:text-white file:px-4 file:py-2 file:rounded-lg file:border-none file:cursor-pointer file:hover:bg-primary/90 transition duration-200"
              />
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={5}
                placeholder="Tell us something about yourself..."
                className="w-full px-4 py-2 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Left Column: Name, Skills, Submit */}
          <div>
            {/* First Name */}
            <div className="mb-4">
              <label htmlFor="firstname" className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                placeholder="Enter Your First Name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary "
              />
            </div>

            {/* Last Name */}
            <div className="mb-4">
              <label htmlFor="lastname" className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                placeholder="Enter Your Last Name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary "
              />
            </div>

            {/* Skills */}
            <div className="mb-4">
              <label htmlFor="skills" className="block text-sm font-medium mb-1">Skills</label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. React, TypeScript, Tailwind"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary "
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition duration-200 mt-6"
            >
              Edit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
