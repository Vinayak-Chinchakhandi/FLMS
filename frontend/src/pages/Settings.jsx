import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Sparkles, X, Plus, Loader2, CheckCircle } from 'lucide-react';
import { getMe, updateSkills } from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('iflo_user') || '{}');

  const [skills,        setSkills]        = useState([]);
  const [newSkill,      setNewSkill]      = useState('');
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsSaving,  setSkillsSaving]  = useState(false);
  const [skillsSaved,   setSkillsSaved]   = useState(false);
  const [skillsError,   setSkillsError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getMe();
        setSkills(res.data.data.skills || []);
      } catch (e) {
        console.error('[Settings] Failed to load profile', e);
        // Fallback to cached user data if available
        setSkills([]);
      } finally {
        setSkillsLoading(false);
      }
    })();
  }, []);

  const addSkill = () => {
    const trimmed = newSkill.trim().toLowerCase();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setNewSkill('');
    setSkillsSaved(false);
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
    setSkillsSaved(false);
  };

  const handleSaveSkills = async () => {
    setSkillsSaving(true);
    setSkillsError('');
    setSkillsSaved(false);
    try {
      await updateSkills(skills);
      setSkillsSaved(true);
      setTimeout(() => setSkillsSaved(false), 3000);
    } catch (e) {
      setSkillsError(e.response?.data?.message || 'Failed to save skills.');
    } finally {
      setSkillsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('iflo_user');
    localStorage.removeItem('iflo_token');
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
            {user.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
            <p className="text-indigo-200 text-sm">{user.email || 'No email'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold capitalize">
              {user.role || 'faculty'}
            </span>
          </div>
        </div>
      </div>

      {/* Skills Editor — shown for faculty only (useful for substitute engine) */}
      {user.role === 'faculty' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800">Teaching Skills</h2>
            <span className="ml-auto text-xs text-slate-400">Used for substitute matching</span>
          </div>

          <div className="p-5 space-y-4">
            {skillsLoading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              </div>
            ) : (
              <>
                {/* Current skills */}
                <div className="flex flex-wrap gap-2 min-h-10">
                  {skills.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No skills added yet.</p>
                  ) : (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-0.5 hover:text-indigo-500 text-indigo-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add skill input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. machine learning, calculus..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-3.5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {skillsError && (
                  <p className="text-sm text-red-600">{skillsError}</p>
                )}

                <button
                  type="button"
                  disabled={skillsSaving}
                  onClick={handleSaveSkills}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {skillsSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : skillsSaved ? (
                    <><CheckCircle className="w-4 h-4" /> Saved!</>
                  ) : (
                    'Save Skills'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600">Sign Out</p>
            <p className="text-xs text-slate-500">Clear session and return to login</p>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 pb-6">IFLO v1.0.0 — Hackathon Build</p>
    </div>
  );
}
