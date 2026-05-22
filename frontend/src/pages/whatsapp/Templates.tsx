import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { whatsappApi } from '@/services/api/whatsapp';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import toast from 'react-hot-toast';

export const Templates: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappApi.getTemplates(),
  });

  const createTemplate = useMutation({
    mutationFn: (data: any) => whatsappApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      setShowCreateModal(false);
      setEditingTemplate(null);
      toast.success('Plantilla creada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear plantilla');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => whatsappApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      setShowCreateModal(false);
      setEditingTemplate(null);
      toast.success('Plantilla actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar plantilla');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => whatsappApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Plantilla eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar plantilla');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      language: formData.get('language'),
      components: [
        {
          type: 'BODY',
          text: formData.get('body'),
        },
      ],
    };

    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplate.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de WhatsApp</h1>
          <p className="text-gray-500 mt-1">Crea y gestiona plantillas de mensajes</p>
        </div>
        <Button icon={<PlusIcon className="w-5 h-5" />} onClick={() => setShowCreateModal(true)}>
          Nueva Plantilla
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template: any, index: number) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{template.language?.toUpperCase()}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setShowCreateModal(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTemplate.mutate(template.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {template.components?.find((c: any) => c.type === 'BODY')?.text || 'Sin contenido'}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {template.status === 'APPROVED' ? 'Aprobada' :
                 template.status === 'PENDING' ? 'Pendiente' : 'Rechazada'}
              </span>
              <button
                onClick={() => {/* TODO: Usar plantilla */}}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
              >
                <DocumentDuplicateIcon className="w-3 h-3 mr-1" />
                Usar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {(!templates || templates.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay plantillas creadas</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-primary-600 hover:text-primary-700 mt-2"
          >
            Crear tu primera plantilla
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
        }}
        title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            label="Nombre de la plantilla"
            defaultValue={editingTemplate?.name}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              name="category"
              defaultValue={editingTemplate?.category || 'UTILITY'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="UTILITY">Utilidad</option>
              <option value="MARKETING">Marketing</option>
              <option value="AUTHENTICATION">Autenticación</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Idioma
            </label>
            <select
              name="language"
              defaultValue={editingTemplate?.language || 'es'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido del mensaje
            </label>
            <textarea
              name="body"
              rows={4}
              defaultValue={editingTemplate?.components?.find((c: any) => c.type === 'BODY')?.text}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Hola {{1}}, gracias por tu compra de ${{2}}..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
            Usa {'{{1}}, {{2}}, etc. para variables dinámicas'}
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setEditingTemplate(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createTemplate.isPending || updateTemplate.isPending}
            >
              {editingTemplate ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};